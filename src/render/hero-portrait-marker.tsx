import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import portraitUrls from '../domain/hero-portraits.json';

const portraits: Record<string, string> = portraitUrls;
const projected = new Vector3();

type Props = {
  heroId: string;
  label: string;
  color: string;
  selected: boolean;
};

const HeroPortraitMarker = ({ heroId, label, color, selected }: Props) => {
  const anchor = useRef<Group>(null);
  const portrait = useRef<HTMLSpanElement>(null);
  const canvas = useThree((state) => state.gl.domElement);

  useLayoutEffect(() => {
    const host = canvas.parentElement;
    if (!host) return;
    const badge = document.createElement('span');
    badge.className = 'map-hero-portrait';
    badge.dataset.hero = heroId;
    badge.setAttribute('aria-hidden', 'true');
    badge.hidden = true;
    badge.textContent = label.slice(0, 2);
    const url = portraits[heroId];
    if (typeof url === 'string') {
      const image = document.createElement('img');
      image.alt = '';
      image.draggable = false;
      image.referrerPolicy = 'no-referrer';
      badge.dataset.imageState = 'loading';
      image.addEventListener('load', () => {
        badge.replaceChildren(image);
        badge.dataset.imageState = 'loaded';
      }, { once: true });
      image.addEventListener('error', () => { badge.dataset.imageState = 'failed'; }, { once: true });
      image.src = url;
    }
    portrait.current = badge;
    host.append(badge);
    return () => { badge.remove(); portrait.current = null; };
  }, [canvas, heroId, label]);

  useLayoutEffect(() => {
    const badge = portrait.current;
    if (!badge) return;
    badge.style.setProperty('--portrait-team', color);
    badge.dataset.selected = String(selected);
  }, [canvas, heroId, label, color, selected]);

  useFrame(({ camera, size }) => {
    const badge = portrait.current;
    if (!badge || !anchor.current) return;
    anchor.current.getWorldPosition(projected).project(camera);
    badge.hidden = Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1 || Math.abs(projected.z) > 1;
    if (!badge.hidden) {
      badge.style.translate = `${(projected.x + 1) * size.width / 2}px ${(1 - projected.y) * size.height / 2}px`;
    }
  });

  return <group ref={anchor} position={[0, 0.55, 0]} />;
};

export default HeroPortraitMarker;
