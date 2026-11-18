import { Vector3 } from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { RiseDirection } from '../domain/map';
import { slopeFraction } from '../domain/surface-height';

const rampGeometry = (direction: RiseDirection) => {
  const vertices: Vector3[] = [];
  for (const x of [-0.5, 0.5]) {
    for (const z of [-0.5, 0.5]) {
      vertices.push(new Vector3(x, -0.5, z));
      if (slopeFraction(direction, x, z) === 1) vertices.push(new Vector3(x, 0.5, z));
    }
  }
  return new ConvexGeometry(vertices);
};

export default rampGeometry;
