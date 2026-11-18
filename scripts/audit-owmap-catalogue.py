import argparse
import json
import math
from pathlib import Path
import re
import runpy
import unicodedata
from uuid import UUID

ROOT = Path(__file__).resolve().parent.parent
INSPECTOR = runpy.run_path(str(ROOT / 'scripts/inspect-owmap.py'))
MODE_NAMES = {
    'control': 'Control', 'escort': 'Escort', 'flashpoint': 'Flashpoint',
    'hybrid': 'Hybrid', 'push': 'Push',
}
KING_ROW_REFERENCE = Path('D4/Overcast - Hybrid.owmap')


def normalized_name(name):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', name.casefold()))


def vector(value, length):
    return isinstance(value, list) and len(value) == length and all(
        type(component) in (float, int) and math.isfinite(component) for component in value
    )


def read_objectives(path):
    records = json.loads(path.read_text(encoding='utf-8-sig'))
    if not isinstance(records, list):
        raise ValueError('Expected an OWLib objective list')
    by_variant = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get('MapName'), str):
            raise ValueError('Each objective record requires MapName')
        name = record['MapName']
        areas = record.get('Areas')
        if not isinstance(areas, list):
            raise ValueError(f'{name}: expected an Areas list')
        rows = {}
        for area in areas:
            if not isinstance(area, dict) or not isinstance(area.get('UUID'), str):
                raise ValueError(f'{name}: expected an area UUID')
            identifier = str(UUID(area['UUID']))
            boxes = area.get('Boxes')
            if identifier in rows or not isinstance(boxes, list):
                raise ValueError(f'{name}: duplicate area UUID or missing Boxes list')
            for box in boxes:
                if not isinstance(box, dict):
                    raise ValueError(f'{name}: expected a box object')
                rotation = box.get('Orientation')
                extents = box.get('Extents')
                if not (
                    vector(rotation, 4)
                    and math.isclose(sum(component ** 2 for component in rotation), 1, rel_tol=1e-3)
                    and vector(box.get('Translation'), 3)
                    and vector(extents, 3)
                    and all(component > 0 for component in extents)
                ):
                    raise ValueError(f'{name}: invalid objective box')
            rows[identifier] = boxes
        signature = tuple((identifier, tuple(sorted(json.dumps(box, sort_keys=True) for box in boxes)))
                          for identifier, boxes in sorted(rows.items()))
        by_variant.setdefault(name, set()).add(signature)
    return by_variant


def objective_summary(entry, objectives):
    if entry['selectedVariant'] is None:
        return {'status': 'not-selected'}
    name = f"{entry['internalName']} - {Path(entry['selectedVariant']).stem}"
    matches = objectives.get(name, set())
    if len(matches) != 1:
        return {'status': 'ambiguous' if matches else 'not-found'}
    areas, = matches
    box_count = sum(len(boxes) for _, boxes in areas)
    status = 'matched' if areas and all(boxes for _, boxes in areas) else 'incomplete-boxes'
    return {'status': status, 'areas': len(areas), 'boxes': box_count}


def inspect_candidate(path):
    map_name, records = INSPECTOR['read_map'](path)
    references = {reference for reference, _ in records}
    model_refs = sorted(ref for ref in references if ref.lower().endswith('.owmdl'))
    entity_refs = sorted(ref for ref in references if ref.lower().endswith('.owentity'))
    missing_models = [ref for ref in model_refs if not INSPECTOR['resolve_model'](path.parent, ref)]
    entity_files = {ref: INSPECTOR['resolve_file'](path.parent, ref, '.owentity') for ref in entity_refs}
    entities = {ref: INSPECTOR['read_entity'](path.parent, file) for ref, file in entity_files.items() if file}
    return {
        'internalName': map_name,
        'directModels': len(model_refs),
        'missingDirectModels': missing_models,
        'entityReferences': len(entity_refs),
        'missingEntityFiles': [ref for ref, file in entity_files.items() if not file],
        'entityPrimaryModels': sum(file is not None for _, file, _ in entities.values()),
        'missingEntityPrimaryModels': {
            ref: asset for ref, (asset, file, _) in entities.items() if asset and not file
        },
        'entityFilesWithNestedAttachments': sum(children > 0 for _, _, children in entities.values()),
    }


def audit_map(maps_root, folders, entry):
    map_id = entry['id']
    folder = folders.get(normalized_name(entry['nameEn']))
    mode = MODE_NAMES[entry['mode']]
    candidates = sorted(path for path in folder.glob('*/*.owmap') if path.stem.endswith(f' - {mode}')) if folder else []
    if map_id == 'kings-row' and folder:
        reference = folder / KING_ROW_REFERENCE
        if reference in candidates:
            candidates.remove(reference)
            candidates.insert(0, reference)
    result = {
        'id': map_id,
        'mode': mode,
        'candidateVariants': [path.relative_to(maps_root).as_posix() for path in candidates],
        'selectedVariant': None,
    }
    for path in candidates:
        try:
            inspection = inspect_candidate(path)
        except (ValueError, OSError, INSPECTOR['struct'].error) as error:
            result.setdefault('unreadableVariants', {})[path.relative_to(maps_root).as_posix()] = str(error)
            continue
        if inspection['directModels'] and (
            result['selectedVariant'] is None or not inspection['missingDirectModels']
        ):
            result.update(inspection, selectedVariant=path.relative_to(maps_root).as_posix())
        if map_id == 'kings-row' or (inspection['directModels'] and not inspection['missingDirectModels']):
            break
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('maps', type=Path)
    parser.add_argument('--game-build', required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--objectives', type=Path)
    args = parser.parse_args()
    maps_root = args.maps.resolve()
    folders = {normalized_name(path.name): path for path in sorted(maps_root.iterdir()) if path.is_dir()}
    catalogue = json.loads((ROOT / 'src/domain/owkr-catalogue.json').read_text())['maps']
    maps = [audit_map(maps_root, folders, entry) for entry in catalogue]
    ready = sum(bool(entry.get('directModels')) and not entry['missingDirectModels'] for entry in maps)
    data = {'schemaVersion': 1, 'gameBuild': args.game_build, 'completeDirectModelSets': ready, 'maps': maps}
    if args.objectives:
        try:
            objectives = read_objectives(args.objectives)
        except (ValueError, OSError) as error:
            parser.error(f'Cannot read OWLib objectives: {error}')
        for entry in maps:
            entry['objectives'] = objective_summary(entry, objectives)
        data['mapsWithObjectiveBoxes'] = sum(entry['objectives']['status'] == 'matched' for entry in maps)
    report = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.write_text(report)
    else:
        print(report, end='')
    return int(ready != len(maps) or (args.objectives is not None and data['mapsWithObjectiveBoxes'] != len(maps)))


if __name__ == '__main__':
    raise SystemExit(main())
