import argparse
import json
from pathlib import Path
import re
import runpy
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
INSPECTOR = runpy.run_path(str(ROOT / 'scripts/inspect-owmap.py'))
MODE_NAMES = {
    'control': 'Control', 'escort': 'Escort', 'flashpoint': 'Flashpoint',
    'hybrid': 'Hybrid', 'push': 'Push',
}
KING_ROW_REFERENCE = Path('D4/Overcast - Hybrid.owmap')


def normalized_name(name):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', name.casefold()))


def inspect_candidate(path):
    map_name, records = INSPECTOR['read_map'](path)
    references = {reference for reference, _ in records}
    model_refs = sorted(ref for ref in references if ref.lower().endswith('.owmdl'))
    entity_refs = sorted(ref for ref in references if ref.lower().endswith('.owentity'))
    missing_models = [ref for ref in model_refs if not INSPECTOR['resolve_model'](path.parent, ref)]
    missing_entities = [
        ref for ref in entity_refs
        if not (path.parent / ref.replace(chr(92), '/')).resolve().is_relative_to(path.parent)
        or not (path.parent / ref.replace(chr(92), '/')).is_file()
    ]
    return {
        'internalName': map_name,
        'directModels': len(model_refs),
        'missingDirectModels': missing_models,
        'entityReferences': len(entity_refs),
        'missingEntityFiles': missing_entities,
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
    args = parser.parse_args()
    maps_root = args.maps.resolve()
    folders = {normalized_name(path.name): path for path in sorted(maps_root.iterdir()) if path.is_dir()}
    catalogue = json.loads((ROOT / 'src/domain/owkr-catalogue.json').read_text())['maps']
    maps = [audit_map(maps_root, folders, entry) for entry in catalogue]
    ready = sum(bool(entry.get('directModels')) and not entry['missingDirectModels'] for entry in maps)
    data = {'schemaVersion': 1, 'gameBuild': args.game_build, 'completeDirectModelSets': ready, 'maps': maps}
    report = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.write_text(report)
    else:
        print(report, end='')
    return int(ready != len(maps))


if __name__ == '__main__':
    raise SystemExit(main())
