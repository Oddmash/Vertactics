import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { useThree } from '@react-three/fiber';

export type ViewportCaptureRef = RefObject<(() => Promise<Blob>) | null>;

const ViewportCapture = ({ capture }: { capture: ViewportCaptureRef }) => {
  const get = useThree((state) => state.get);
  useLayoutEffect(() => {
    capture.current = () => new Promise((resolve, reject) => {
      const { gl, scene, camera } = get();
      if (gl.getContext().isContextLost()) {
        reject(new Error('WebGL context lost'));
        return;
      }
      gl.render(scene, camera);
      gl.domElement.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to encode map image'));
      }, 'image/png');
    });
    return () => { capture.current = null; };
  }, [capture, get]);
  return null;
};

export default ViewportCapture;
