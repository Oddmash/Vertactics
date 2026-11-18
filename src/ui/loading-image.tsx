import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Props = {
  src: string;
  width: number;
  height: number;
  fallback?: ReactNode;
  loading?: 'eager' | 'lazy';
};

const LoadingImage = ({ src, width, height, fallback, loading = 'lazy' }: Props) => {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const style = { '--image-width': `${width}px`, aspectRatio: width / height } as CSSProperties;
  return <span className="loading-image" data-image-state={state} data-has-placeholder={fallback !== undefined}
    style={style} aria-hidden="true">
    {state !== 'loaded' && fallback !== undefined && <span className="image-placeholder">{fallback}</span>}
    {state !== 'failed' && <img src={src} alt="" width={width} height={height}
      loading={loading} draggable={false} referrerPolicy="no-referrer"
      onLoad={() => setState('loaded')} onError={() => setState('failed')} />}
  </span>;
};

export default LoadingImage;
