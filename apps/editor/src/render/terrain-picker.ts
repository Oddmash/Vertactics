import { Raycaster, Vector2 } from 'three';
import type { Camera, Scene } from 'three';
import type { Terrain, TerrainBlock } from '../domain/map';
import { pickTerrainSurface } from '../domain/surface-height';

export const terrainPicker = (canvas: HTMLCanvasElement, scene: Scene, camera: Camera, snap: boolean) => {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  return ({ clientX, clientY }: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
    pointer.set(2 * (clientX - rect.left) / rect.width - 1, 1 - 2 * (clientY - rect.top) / rect.height);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const group = scene.getObjectByName('walkable-terrain');
    const hit = group && raycaster.intersectObject(group, true)[0];
    if (!hit) return null;
    const { terrain, block } = hit.object.userData as { terrain: Terrain; block: TerrainBlock };
    return pickTerrainSurface(terrain, block, [hit.point.x, hit.point.y, hit.point.z], snap);
  };
};
