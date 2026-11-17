import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Raycaster, Vector2, Vector3 } from 'three';
import type { Terrain, TerrainBlock, WorldPoint } from '../domain/map';
import { snapSurfacePoint } from '../domain/surface-snap';

type Props = {
  groups: { terrain: Terrain; blocks: TerrainBlock[] }[];
  snap: boolean;
  onPreview: (point: WorldPoint | null) => void;
  onFinish: (point: WorldPoint | null) => void;
};

const SurfaceDrag = ({ groups, snap, onPreview, onFinish }: Props) => {
  const { camera, gl } = useThree();

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const hit = new Vector3();
    const boxes = groups.flatMap(({ terrain, blocks }) => blocks.map((block) => ({
      block,
      walkable: terrain.kind !== 'wall',
      bounds: new Box3().setFromCenterAndSize(new Vector3(...block.center), new Vector3(...block.size)),
    })));
    let pointerId: number | null = null;

    const getPoint = (event: PointerEvent): WorldPoint | null => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      let distance = Infinity;
      let result: WorldPoint | null = null;
      for (const { block, walkable, bounds } of boxes) {
        if (!raycaster.ray.intersectBox(bounds, hit)) continue;
        const nextDistance = hit.distanceToSquared(raycaster.ray.origin);
        if (nextDistance >= distance) continue;
        distance = nextDistance;
        if (!walkable || Math.abs(hit.y - bounds.max.y) >= 0.0001) {
          result = null;
          continue;
        }
        const point: WorldPoint = [hit.x, bounds.max.y, hit.z];
        result = snap ? snapSurfacePoint(point, block.center, block.size) : point;
      }
      return result;
    };

    const start = (event: PointerEvent) => {
      if (event.button === 0 && pointerId === null) pointerId = event.pointerId;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId === pointerId) onPreview(getPoint(event));
    };
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      onFinish(getPoint(event));
    };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', finish);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', finish);
    };
  }, [camera, gl, groups, snap, onPreview, onFinish]);

  return null;
};

export default SurfaceDrag;
