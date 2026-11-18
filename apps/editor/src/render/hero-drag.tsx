import { useEffectEvent, useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import type { WorldPoint } from '../domain/map';
import { terrainPicker } from './terrain-picker';

export type HeroDragPreview = { id: string; point: WorldPoint | null; overTrash: boolean };
export type HeroDrop = WorldPoint | 'trash';

type Props = {
  snap: boolean;
  enabled: boolean;
  trash: RefObject<HTMLDivElement | null>;
  onPreview: (preview: HeroDragPreview | null) => void;
  onSelect: (id: string) => void;
  onDrop?: (id: string, drop: HeroDrop) => void;
};

type Gesture = {
  id: string;
  pointerId: number;
  marker: HTMLElement;
  x: number;
  y: number;
  active: boolean;
  moved: boolean;
  point: WorldPoint | null;
  timer: number;
};

const HeroDrag = ({ snap, enabled, trash, onPreview, onSelect, onDrop }: Props) => {
  const { camera, gl, scene } = useThree();
  const preview = useEffectEvent(onPreview);
  const select = useEffectEvent(onSelect);
  const drop = useEffectEvent((id: string, target: HeroDrop) => onDrop?.(id, target));

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const host = canvas.parentElement;
    if (!enabled || !host) return;
    const getPoint = terrainPicker(canvas, scene, camera, snap);
    let gesture: Gesture | undefined;

    const overTrash = ({ clientX, clientY }: PointerEvent) => {
      const rect = trash.current?.getBoundingClientRect();
      return Boolean(rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
    };

    const cancel = () => {
      const current = gesture;
      if (!current) return;
      gesture = undefined;
      window.clearTimeout(current.timer);
      if (current.marker.hasPointerCapture(current.pointerId)) current.marker.releasePointerCapture(current.pointerId);
      if (current.active) preview(null);
    };

    const activate = (current: Gesture) => {
      if (current.active) return;
      current.active = true;
      select(current.id);
      preview({ id: current.id, point: null, overTrash: false });
    };

    const getMarker = (event: Event) => event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-draggable="true"][data-placement]') : null;

    const start = (event: PointerEvent) => {
      if (gesture || event.button !== 0 || !event.isPrimary) return;
      const marker = getMarker(event);
      const id = marker?.dataset.placement;
      if (!marker || !id) return;
      event.preventDefault();
      event.stopPropagation();
      marker.setPointerCapture(event.pointerId);
      const current: Gesture = {
        id, marker, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        active: false, moved: false, point: null, timer: 0,
      };
      gesture = current;
      current.timer = window.setTimeout(() => activate(current), 240);
    };

    const move = (event: PointerEvent) => {
      const current = gesture;
      if (!current || event.pointerId !== current.pointerId) return;
      event.stopPropagation();
      current.moved ||= Math.hypot(event.clientX - current.x, event.clientY - current.y) >= 5;
      if (!current.moved) return;
      activate(current);
      const over = overTrash(event);
      if (!over) current.point = getPoint(event) ?? current.point;
      preview({ id: current.id, point: current.point, overTrash: over });
    };

    const finish = (event: PointerEvent) => {
      const current = gesture;
      if (!current || event.pointerId !== current.pointerId) return;
      event.stopPropagation();
      const target = current.active && current.moved ? (overTrash(event) ? 'trash' : getPoint(event)) : null;
      cancel();
      if (target) drop(current.id, target);
      else if (!current.active) select(current.id);
    };

    const cancelPointer = (event: PointerEvent) => {
      if (event.pointerId === gesture?.pointerId) cancel();
    };
    const cancelKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };

    const handleMarkerClick = (event: MouseEvent) => {
      if (getMarker(event)) event.stopPropagation();
    };

    host.addEventListener('click', handleMarkerClick);
    host.addEventListener('pointerdown', start);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', finish);
    host.addEventListener('pointercancel', cancelPointer);
    host.addEventListener('lostpointercapture', cancelPointer);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', cancelKey);
    return () => {
      cancel();
      host.removeEventListener('click', handleMarkerClick);
      host.removeEventListener('pointerdown', start);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', finish);
      host.removeEventListener('pointercancel', cancelPointer);
      host.removeEventListener('lostpointercapture', cancelPointer);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', cancelKey);
    };
  }, [camera, enabled, gl, scene, snap, trash]);

  return null;
};

export default HeroDrag;
