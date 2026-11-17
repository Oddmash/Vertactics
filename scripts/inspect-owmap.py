import argparse
from collections import Counter
from functools import lru_cache
import json
import math
from pathlib import Path
import struct
import zlib


class Binary:
    def __init__(self, path):
        self.data = path.read_bytes()
        self.offset = 0

    def read(self, fmt):
        values = struct.unpack_from('<' + fmt, self.data, self.offset)
        self.offset += struct.calcsize('<' + fmt)
        return values

    def skip(self, size):
        self.offset += size
        if self.offset > len(self.data):
            raise ValueError('Truncated record')

    def string(self):
        length = 0
        for shift in range(0, 35, 7):
            byte, = self.read('B')
            length |= (byte & 127) << shift
            if byte < 128:
                start = self.offset
                self.skip(length)
                return self.data[start:self.offset].decode('utf-8')
        raise ValueError('Invalid string length')


def read_map(path):
    stream = Binary(path)
    if stream.read('HH') not in ((2, 0), (2, 1)):
        raise ValueError('Unsupported OWMAP version')
    name = stream.string()
    objects, details, _ = stream.read('III')
    instances = []
    for _ in range(objects):
        model = stream.string()
        groups, = stream.read('I')
        for _ in range(groups):
            stream.string()
            count, = stream.read('I')
            instances.extend((model, stream.read('10f')) for _ in range(count))
    for _ in range(details):
        model = stream.string()
        stream.string()
        instances.append((model, stream.read('10f')))
    return name, instances


def resolve_file(root, reference, suffix):
    root = root.resolve()
    path = (root / reference.replace(chr(92), '/')).resolve()
    if not path.is_relative_to(root) or path.suffix.lower() != suffix:
        return None
    return path if path.is_file() else None


def resolve_model(root, reference):
    return resolve_file(root, reference, '.owmdl')


def read_entity(root, entity):
    stream = Binary(entity)
    if stream.string() != 'owentity' or stream.read('HH') != (2, 1):
        raise ValueError(f'Unsupported OWENTITY version: {entity.name}')
    stream.string()
    model = stream.string()
    stream.string()
    _, _, _, children = stream.read('IIII')
    for _ in range(children):
        stream.string()
        stream.skip(24)
        stream.string()
    stream.string()
    base_dir = stream.string().replace(chr(92), '/')
    if model == 'null':
        return None, None, children
    folder = (entity.parent / base_dir / 'Models' / model).resolve()
    model_file = (folder / Path(model).with_suffix('.owmdl').name).resolve()
    if not model_file.is_relative_to(root) or not model_file.is_file():
        return model, None, children
    return model, model_file, children


@lru_cache(maxsize=512)
def model_vertices(path):
    stream = Binary(path)
    if stream.read('HH') != (2, 0):
        raise ValueError(f'Unsupported model version: {path.name}')
    stream.string()
    stream.string()
    _, bones, meshes, _ = stream.read('IHII')
    for _ in range(bones):
        stream.string()
        stream.skip(38)
    points = []
    for _ in range(meshes):
        stream.string()
        _, uv_count, vertex_count, index_count, weights = stream.read('QBIIb')
        start = stream.offset
        stream.skip(12 * vertex_count)
        points.extend(struct.iter_unpack('<3f', stream.data[start:stream.offset]))
        stream.skip(vertex_count * (60 + 8 * uv_count + 6 * max(0, weights)) + 12 * index_count)
    return points


def transform(record):
    x, y, z, sx, sy, sz, qx, qy, qz, qw = record
    return (x, y, z), (
        ((1 - 2 * (qy*qy + qz*qz)) * sx, 2 * (qx*qy - qz*qw) * sy, 2 * (qx*qz + qy*qw) * sz),
        (2 * (qx*qy + qz*qw) * sx, (1 - 2 * (qx*qx + qz*qz)) * sy, 2 * (qy*qz - qx*qw) * sz),
        (2 * (qx*qz - qy*qw) * sx, 2 * (qy*qz + qx*qw) * sy, (1 - 2 * (qx*qx + qy*qy)) * sz),
    )


def write_cloud(path, instances, bounds, resolution):
    low, high = bounds
    scale = (resolution - 1) / max(high[0] - low[0], high[2] - low[2])
    width = min(resolution, math.ceil((high[0] - low[0]) * scale) + 1)
    height = min(resolution, math.ceil((high[2] - low[2]) * scale) + 1)
    pixels = bytearray(width * height)
    for model, record in instances:
        (x, y, z), (row_x, row_y, row_z) = transform(record)
        for a, b, c in model_vertices(model):
            px = round((x + a*row_x[0] + b*row_x[1] + c*row_x[2] - low[0]) * scale)
            py = round((z + a*row_z[0] + b*row_z[1] + c*row_z[2] - low[2]) * scale)
            if 0 <= px < width and 0 <= py < height:
                altitude = y + a*row_y[0] + b*row_y[1] + c*row_y[2]
                shade = min(255, max(35, round(100 + 3 * altitude)))
                index = py * width + px
                if pixels[index] < shade:
                    pixels[index] = shade
    scanlines = b''.join(b'\0' + pixels[i:i + width] for i in range(0, len(pixels), width))

    def chunk(kind, data):
        content = kind + data
        return struct.pack('>I', len(data)) + content + struct.pack('>I', zlib.crc32(content))

    header = struct.pack('>IIBBBBB', width, height, 8, 0, 0, 0, 0)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) +
                     chunk(b'IDAT', zlib.compress(scanlines)) + chunk(b'IEND', b''))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('map', type=Path)
    parser.add_argument('--preview', type=Path)
    args = parser.parse_args()
    path = args.map.resolve()
    name, records = read_map(path)
    root = path.parent
    model_refs = {ref for ref, _ in records if ref.lower().endswith('.owmdl')}
    direct_models = {ref: resolve_model(root, ref) for ref in model_refs}
    entity_refs = {ref for ref, _ in records if ref.lower().endswith('.owentity')}
    entity_files = {ref: resolve_file(root, ref, '.owentity') for ref in entity_refs}
    entities = {ref: read_entity(root, file) for ref, file in entity_files.items() if file}
    entity_models = {ref: model for ref, (_, model, _) in entities.items()}
    models = direct_models | entity_models
    instances = [(models[ref], record) for ref, record in records if models.get(ref)]
    low, high = [math.inf] * 3, [-math.inf] * 3
    vertex_instances = 0
    for model, record in instances:
        origin, rows = transform(record)
        vertices = model_vertices(model)
        vertex_instances += len(vertices)
        for a, b, c in vertices:
            for axis, (r, s, t) in enumerate(rows):
                value = origin[axis] + a*r + b*s + c*t
                low[axis] = min(low[axis], value)
                high[axis] = max(high[axis], value)
    missing = Counter(ref for ref, _ in records if ref in direct_models and not direct_models[ref])
    rendered_entities = sum(entity_models.get(ref) is not None for ref, _ in records)
    entity_count = sum(ref in entity_refs for ref, _ in records)
    print(json.dumps({
        'map': name, 'variant': path.name, 'instances': len(records), 'model_instances': len(instances),
        'resolved_models': len({model for model in models.values() if model}),
        'vertex_instances': vertex_instances, 'bounds_xyz': [low, high] if vertex_instances else None,
        'entity_instances_rendered': rendered_entities,
        'entity_instances_without_primary_model': entity_count - rendered_entities,
        'entity_files_with_nested_attachments': sum(children > 0 for _, _, children in entities.values()),
        'missing_model_references': dict(missing),
        'missing_entity_files': sorted(ref for ref, file in entity_files.items() if not file),
        'missing_entity_model_references': {
            ref: asset for ref, (asset, file, _) in sorted(entities.items()) if asset and not file
        },
    }, indent=2))
    if args.preview:
        if not vertex_instances:
            raise ValueError('No model vertices for preview')
        write_cloud(args.preview, instances, (low, high), 1400)


if __name__ == '__main__':
    main()
