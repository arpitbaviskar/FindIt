import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * A rectangle whose position and size are expressed as a fraction of the
 * source image. Keeping annotations in this form means they remain portable
 * across phones, orientations, and image sizes.
 */
export interface NormalizedRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationCanvasProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  existingRectangle?: NormalizedRectangle | null;
  onRectangleChange: (rectangle: NormalizedRectangle) => void;
  onConfirm: (rectangle: NormalizedRectangle) => void;
  selectedObjectLabel?: string;
  confirmLabel?: string;
  alt?: string;
  className?: string;
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function sanitizeRectangle(rectangle: NormalizedRectangle | null | undefined) {
  if (!rectangle) return null;

  const startX = clamp(rectangle.x);
  const startY = clamp(rectangle.y);
  const endX = clamp(rectangle.x + rectangle.width);
  const endY = clamp(rectangle.y + rectangle.height);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return width > 0 && height > 0
    ? { x, y, width, height }
    : null;
}

function rectanglesMatch(
  first: NormalizedRectangle | null,
  second: NormalizedRectangle | null,
) {
  if (first === second) return true;
  if (!first || !second) return false;

  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

function rectangleFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return sanitizeRectangle({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });
}

function rectangleStyle(rectangle: NormalizedRectangle) {
  return {
    left: `${rectangle.x * 100}%`,
    top: `${rectangle.y * 100}%`,
    width: `${rectangle.width * 100}%`,
    height: `${rectangle.height * 100}%`,
  };
}

export function AnnotationCanvas({
  imageSrc,
  imageWidth,
  imageHeight,
  existingRectangle,
  onRectangleChange,
  onConfirm,
  selectedObjectLabel = 'Selected object',
  confirmLabel = 'Use this selection',
  alt = 'Photo ready for annotation',
  className = '',
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const previousRectangleRef = useRef<NormalizedRectangle | null>(
    sanitizeRectangle(existingRectangle),
  );
  const pointerIdRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const [rectangle, setRectangle] = useState<NormalizedRectangle | null>(
    sanitizeRectangle(existingRectangle),
  );
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const nextRectangle = sanitizeRectangle(existingRectangle);
    if (!isDrawing) {
      previousRectangleRef.current = nextRectangle;
      setRectangle((currentRectangle) =>
        rectanglesMatch(currentRectangle, nextRectangle) ? currentRectangle : nextRectangle,
      );
    }
  }, [existingRectangle]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return null;

    return {
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height),
    };
  };

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const startPoint = startPointRef.current;
    const currentPoint = pointFromEvent(event);
    if (!startPoint || !currentPoint) return;

    const nextRectangle = rectangleFromPoints(startPoint, currentPoint);
    if (!nextRectangle) return;

    setRectangle(nextRectangle);
    onRectangleChange(nextRectangle);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || pointerIdRef.current !== null) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    if (!point) return;

    pointerIdRef.current = event.pointerId;
    startPointRef.current = point;
    previousRectangleRef.current = rectangle;
    setIsDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    const startPoint = startPointRef.current;
    const endPoint = pointFromEvent(event);
    const nextRectangle =
      startPoint && endPoint ? rectangleFromPoints(startPoint, endPoint) : null;

    if (nextRectangle) {
      setRectangle(nextRectangle);
      onRectangleChange(nextRectangle);
    } else {
      setRectangle(previousRectangleRef.current);
    }

    pointerIdRef.current = null;
    startPointRef.current = null;
    setIsDrawing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    setRectangle(previousRectangleRef.current);
    pointerIdRef.current = null;
    startPointRef.current = null;
    setIsDrawing(false);
  };

  const safeWidth = Number.isFinite(imageWidth) && imageWidth > 0 ? imageWidth : 1;
  const safeHeight = Number.isFinite(imageHeight) && imageHeight > 0 ? imageHeight : 1;

  return (
    <section
      className={`w-full select-none ${className}`}
      data-testid="annotation-canvas"
      aria-label="Photo annotation"
    >
      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden rounded-[1.45rem] border border-border bg-secondary shadow-soft"
        style={{ aspectRatio: `${safeWidth} / ${safeHeight}`, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={updateFromPointer}
        onPointerUp={finishPointer}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        data-testid="annotation-canvas-surface"
      >
        <img
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          data-testid="annotation-image"
        />

        <div className="pointer-events-none absolute inset-0 bg-foreground/[0.04]" />

        {rectangle && (
          <div
            className={`pointer-events-none absolute rounded-[0.75rem] border-[2.5px] border-primary bg-primary/[0.10] shadow-[0_0_0_9999px_hsl(var(--foreground)/0.12)] ${
              isDrawing ? 'opacity-90' : 'opacity-100'
            }`}
            style={rectangleStyle(rectangle)}
            data-testid="annotation-selection"
          >
            <span
              className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-card/95 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.02em] text-primary shadow-sm"
              data-testid="text-selected-object-label"
            >
              {selectedObjectLabel}
            </span>
            <span className="absolute -left-[3px] -top-[3px] h-3 w-3 rounded-full border-2 border-card bg-primary" />
            <span className="absolute -right-[3px] -top-[3px] h-3 w-3 rounded-full border-2 border-card bg-primary" />
            <span className="absolute -bottom-[3px] -left-[3px] h-3 w-3 rounded-full border-2 border-card bg-primary" />
            <span className="absolute -bottom-[3px] -right-[3px] h-3 w-3 rounded-full border-2 border-card bg-primary" />
          </div>
        )}

        {!rectangle && !isDrawing && (
          <div
            className="pointer-events-none absolute inset-x-6 bottom-5 rounded-full bg-foreground/75 px-4 py-2.5 text-center text-xs font-semibold text-background backdrop-blur-sm"
            data-testid="text-annotation-instruction"
          >
            Draw around the object with one finger
          </div>
        )}
      </div>

      <button
        type="button"
        className="primary-button mt-4 w-full"
        disabled={!rectangle}
        onClick={() => {
          if (rectangle) onConfirm(rectangle);
        }}
        data-testid="button-confirm-annotation"
      >
        <Check size={18} strokeWidth={2.4} aria-hidden="true" />
        {confirmLabel}
      </button>
    </section>
  );
}

export default AnnotationCanvas;