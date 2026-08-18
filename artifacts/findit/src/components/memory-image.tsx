import type { CSSProperties } from 'react';

import type { NormalizedRectangle } from './annotation-canvas';

export type MemoryImageAnnotation = NormalizedRectangle & {
  id?: string | number;
  label?: string;
};

export interface MemoryImageProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  annotations: readonly MemoryImageAnnotation[];
  alt?: string;
  className?: string;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function overlayStyle(annotation: MemoryImageAnnotation): CSSProperties {
  const startX = clamp(annotation.x);
  const startY = clamp(annotation.y);
  const endX = clamp(annotation.x + annotation.width);
  const endY = clamp(annotation.y + annotation.height);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  };
}

function labelStyle(annotation: MemoryImageAnnotation): CSSProperties {
  const y = clamp(annotation.y);
  return y < 0.12 ? { top: 'calc(100% + 0.45rem)' } : { bottom: 'calc(100% + 0.45rem)' };
}

export function MemoryImage({
  imageSrc,
  imageWidth,
  imageHeight,
  annotations,
  alt = 'Saved memory',
  className = '',
}: MemoryImageProps) {
  const safeWidth = Number.isFinite(imageWidth) && imageWidth > 0 ? imageWidth : 1;
  const safeHeight = Number.isFinite(imageHeight) && imageHeight > 0 ? imageHeight : 1;

  return (
    <figure
      className={`relative w-full overflow-visible ${className}`}
      style={{ aspectRatio: `${safeWidth} / ${safeHeight}` }}
      data-testid="memory-image"
    >
      <div className="absolute inset-0 overflow-hidden rounded-[1.35rem] border border-border bg-secondary shadow-soft">
        <img
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          data-testid="memory-image-source"
        />

        {annotations.map((annotation, index) => {
          const key = annotation.id ?? `annotation-${index}`;
          const hasLabel = Boolean(annotation.label?.trim());

          return (
            <div
              key={key}
              className="pointer-events-none absolute rounded-[0.7rem] border-2 border-accent bg-accent/[0.09]"
              style={overlayStyle(annotation)}
              data-testid={`memory-annotation-${key}`}
              aria-label={annotation.label || `Annotation ${index + 1}`}
            >
              {hasLabel && (
                <span
                  className="absolute left-0 z-10 whitespace-nowrap rounded-full bg-card/95 px-2.5 py-1 text-[0.65rem] font-bold text-foreground shadow-sm"
                  style={labelStyle(annotation)}
                  data-testid={`memory-annotation-label-${key}`}
                >
                  {annotation.label}
                </span>
              )}
              <span className="absolute -left-[3px] -top-[3px] h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
              <span className="absolute -right-[3px] -top-[3px] h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
              <span className="absolute -bottom-[3px] -left-[3px] h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
              <span className="absolute -bottom-[3px] -right-[3px] h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export default MemoryImage;