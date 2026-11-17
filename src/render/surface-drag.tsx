import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import type { Terrain, TerrainBlock, WorldPoint } from '../domain/map';
import { pickTerrainSurface } from '../domain/surface-height';

type Props = {
  snap: boolean;
  onPreview: (point: WorldPoint | null) => void;
  onFinish: (point: WorldPoint | null) => void;
};

const SurfaceDrag = ({ snap, onPreview, onFinish }: Props) => {
  const { camera, gl, scene } = useThree();

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let pointerId: number | null = null;

    const getPoint = (event: PointerEvent): WorldPoint | null => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const group = scene.getObjectByName('walkable-terrain');
      if (!group) return null;
      const hit = raycaster.intersectObject(group, true)[0];
      if (!hit) return null;
      const { terrain, block } = hit.object.userData as { terrain: Terrain; block: TerrainBlock };
      return pickTerrainSurface(terrain, block, [hit.point.x, hit.point.y, hit.point.z], snap);
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
  }, [camera, gl, scene, snap, onPreview, onFinish]);

  return null;
};

export default SurfaceDrag;
