import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { isCatalogueHero } from '../domain/hero-catalogue';
import { publicAsset } from '../ui/public-asset';
const projected = new Vector3();

type Props = {
  id: string;
  heroId: string;
  label: string;
  color: string;
  selected: boolean;
  draggable?: boolean;
  dragging?: boolean;
  overTrash?: boolean;
};

const HeroPortraitMarker = ({ id, heroId, label, color, selected, draggable, dragging, overTrash }: Props) => {
  const anchor = useRef<Group>(null);
  const portrait = useRef<HTMLSpanElement>(null);
  const canvas = useThree((state) => state.gl.domElement);

  useLayoutEffect(() => {
    const host = canvas.parentElement;
    if (!host) return;
    const badge = document.createElement('span');
    badge.className = 'map-hero-portrait';
    badge.dataset.hero = heroId;
    badge.dataset.placement = id;
    badge.setAttribute('aria-hidden', 'true');
    badge.hidden = true;
    badge.textContent = label.slice(0, 2);
    if (isCatalogueHero(heroId)) {
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
      image.src = publicAsset(`images/heroes/${heroId}.webp`);
    }
    portrait.current = badge;
    host.append(badge);
    return () => { badge.remove(); portrait.current = null; };
  }, [canvas, id, heroId, label]);

  useLayoutEffect(() => {
    const badge = portrait.current;
    if (!badge) return;
    badge.style.setProperty('--portrait-team', color);
    badge.dataset.selected = String(selected);
    badge.dataset.draggable = String(Boolean(draggable));
    badge.dataset.dragging = String(Boolean(dragging));
    badge.dataset.overTrash = String(Boolean(overTrash));
  }, [canvas, id, heroId, label, color, selected, draggable, dragging, overTrash]);

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
