import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Props = {
  src: string;
  width: number;
  height: number;
  fallback?: ReactNode;
};

const LoadingImage = ({ src, width, height, fallback }: Props) => {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const style = { '--image-width': `${width}px`, aspectRatio: width / height } as CSSProperties;
  return <span className="loading-image" data-image-state={state} style={style} aria-hidden="true">
    {state === 'failed' ? fallback : <img src={src} alt="" width={width} height={height}
      loading="lazy" draggable={false} referrerPolicy="no-referrer"
      onLoad={() => setState('loaded')} onError={() => setState('failed')} />}
  </span>;
};

export default LoadingImage;
