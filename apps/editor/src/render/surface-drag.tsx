import { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { WorldPoint } from '../domain/map';
import { terrainPicker } from './terrain-picker';

type Props = {
  snap: boolean;
  sampleStart?: boolean;
  onPreview?: (point: WorldPoint | null) => void;
  onFinish?: (point: WorldPoint | null) => void;
  externalDrop?: { type: string; finish: (data: string, point: WorldPoint) => void };
};

const SurfaceDrag = ({ snap, sampleStart, onPreview, onFinish, externalDrop }: Props) => {
  const { camera, gl, scene } = useThree();
  const pointerId = useRef<number | null>(null);

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const getPoint = terrainPicker(canvas, scene, camera, snap);

    const start = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId.current !== null) return;
      pointerId.current = event.pointerId;
      if (sampleStart) {
        canvas.setPointerCapture(event.pointerId);
        onPreview?.(getPoint(event));
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId === pointerId.current) onPreview?.(getPoint(event));
    };
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      pointerId.current = null;
      onFinish?.(getPoint(event));
    };
    const cancel = () => { pointerId.current = null; };
    const dragOver = (event: DragEvent) => {
      if (!externalDrop || !event.dataTransfer?.types.includes(externalDrop.type)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    };
    const drop = (event: DragEvent) => {
      if (!externalDrop || !event.dataTransfer?.types.includes(externalDrop.type)) return;
      event.preventDefault();
      const point = getPoint(event);
      if (point) externalDrop.finish(event.dataTransfer.getData(externalDrop.type), point);
    };
    if (onFinish) {
      canvas.addEventListener('pointerdown', start);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', finish);
      canvas.addEventListener('pointercancel', cancel);
      if (!sampleStart) canvas.addEventListener('pointerleave', cancel);
    }
    canvas.addEventListener('dragover', dragOver);
    canvas.addEventListener('drop', drop);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', finish);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('pointerleave', cancel);
      canvas.removeEventListener('dragover', dragOver);
      canvas.removeEventListener('drop', drop);
    };
  }, [camera, gl, scene, snap, sampleStart, onPreview, onFinish, externalDrop]);

  return null;
};

export default SurfaceDrag;
