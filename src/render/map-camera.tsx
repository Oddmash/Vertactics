import { useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MOUSE, OrthographicCamera, PerspectiveCamera, TOUCH, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { heroEyeHeight } from '../domain/strategy';
import type { HeroPlacement } from '../domain/strategy';
import type { mapBounds, WorldPoint } from '../domain/map';

export type ViewMode = '2d' | '3d';

type Props = {
  mode: ViewMode;
  bounds: ReturnType<typeof mapBounds>;
  reset: number;
  pointerEditing: boolean;
  heroView?: HeroPlacement;
  focusPoint?: WorldPoint;
};

const MapCamera = ({ mode, bounds, reset, pointerEditing, heroView, focusPoint }: Props) => {
  const { gl, set, get, invalidate, size } = useThree();
  const heroCamera = useMemo(() => Object.assign(new PerspectiveCamera(66), { manual: true }), []);
  const controls = useRef<OrbitControls | null>(null);
  const camera = useMemo(() => {
    const view = mode === '2d' ? new OrthographicCamera() : new PerspectiveCamera(39);
    if (mode === '2d') view.up.set(0, 0, -1);
    return Object.assign(view, { manual: true });
  }, [mode]);

  const spanX = bounds.max[0] - bounds.min[0];
  const spanY = bounds.max[1] - bounds.min[1];
  const spanZ = bounds.max[2] - bounds.min[2];
  const span = Math.max(spanX, spanY, spanZ);
  const aspect = size.width / Math.max(size.height, 1);

  useLayoutEffect(() => {
    const previousCamera = get().camera;
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableRotate = mode === '3d';
    orbit.screenSpacePanning = true;
    orbit.minDistance = span * 0.12;
    orbit.maxDistance = span * 5;
    orbit.minZoom = 0.35;
    orbit.maxZoom = 8;
    if (mode === '3d') {
      orbit.maxPolarAngle = Math.PI / 2 - 0.03;
      orbit.minPolarAngle = 0.04;
    } else {
      orbit.mouseButtons.LEFT = MOUSE.PAN;
      orbit.touches.ONE = TOUCH.PAN;
    }
    const requestFrame = () => invalidate();
    orbit.addEventListener('change', requestFrame);
    controls.current = orbit;
    set({ camera });

    return () => {
      orbit.removeEventListener('change', requestFrame);
      orbit.dispose();
      controls.current = null;
      if (get().camera === camera) set({ camera: previousCamera });
    };
  }, [camera, get, gl, invalidate, mode, set, span]);

  useLayoutEffect(() => {
    if (controls.current) controls.current.enabled = !pointerEditing && !heroView;
  }, [camera, heroView, pointerEditing, span]);

  useLayoutEffect(() => {
    const target = new Vector3(...(mode === '2d' && focusPoint ? focusPoint : bounds.center));
    camera.near = span * 0.002;
    camera.far = span * 12;
    camera.zoom = mode === '2d' && focusPoint ? 2.8 : 1;

    if (camera instanceof OrthographicCamera) {
      camera.position.copy(target).add(new Vector3(0, span * 2, 0));
    } else {
      camera.position.copy(target).add(new Vector3(span * 0.62, span * 0.68, span * 0.85));
    }

    camera.lookAt(target);
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.update();
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  }, [bounds.center, camera, focusPoint, invalidate, mode, reset, span]);

  useLayoutEffect(() => {
    if (aspect <= 0) return;
    if (camera instanceof OrthographicCamera) {
      const halfHeight = Math.max(spanX / aspect, spanZ) * 0.61;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
    } else {
      camera.aspect = aspect;
      const verticalFov = 2 * Math.atan(Math.tan(39 * Math.PI / 360) / Math.min(aspect, 1));
      camera.fov = verticalFov * 180 / Math.PI;
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [aspect, camera, invalidate, spanX, spanZ]);

  useLayoutEffect(() => {
    gl.domElement.dataset.viewMode = heroView ? 'hero' : mode;
    if (!heroView) return;
    const [x, y, z] = heroView.position;
    const yaw = heroView.yaw * Math.PI / 180;
    heroCamera.position.set(x, y + heroEyeHeight, z);
    heroCamera.lookAt(x + Math.sin(yaw), y + heroEyeHeight, z - Math.cos(yaw));
    heroCamera.aspect = aspect || 1;
    heroCamera.near = 0.05;
    heroCamera.far = span * 12;
    heroCamera.updateProjectionMatrix();
    heroCamera.updateMatrixWorld();
    set({ camera: heroCamera });
    invalidate();

    return () => {
      if (get().camera === heroCamera) set({ camera });
      invalidate();
    };
  }, [aspect, camera, get, gl, heroCamera, heroView, invalidate, mode, set, span]);

  return null;
};

export default MapCamera;
