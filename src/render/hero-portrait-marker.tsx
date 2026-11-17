import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { SRGBColorSpace, TextureLoader } from 'three';
import type { Texture } from 'three';
import portraitUrls from '../domain/hero-portraits.json';

const portraits: Record<string, string> = portraitUrls;

const HeroPortraitMarker = ({ heroId }: { heroId: string }) => {
  const [image, setImage] = useState<Texture>();
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const url = portraits[heroId];
    if (!url) return;
    let active = true;
    const texture = new TextureLoader().load(url, (loaded) => {
      if (!active) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      setImage(loaded);
      invalidate();
    }, undefined, () => {});
    return () => {
      active = false;
      texture.dispose();
    };
  }, [heroId, invalidate]);

  if (!image) return null;
  return (
    <sprite position={[0, 0.98, 0]} scale={[1.24, 1.24, 1]}>
      <spriteMaterial map={image} transparent alphaTest={0.1} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

export default HeroPortraitMarker;
