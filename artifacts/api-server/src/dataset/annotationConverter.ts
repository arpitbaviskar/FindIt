export interface NormalizedAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YoloAnnotation {
  classId: number;
  xCenter: number;
  yCenter: number;
  width: number;
  height: number;
}

/**
 * Converts FindIt's top-left normalized rectangle into the center-based
 * normalized rectangle expected by YOLO dataset labels.
 *
 * This is intentionally a pure preparation utility. Step 2 does not create
 * datasets, augment images, or train/infer a model.
 */
export function toYoloAnnotation(
  annotation: NormalizedAnnotation,
  classId = 0,
): YoloAnnotation {
  return {
    classId,
    xCenter: annotation.x + annotation.width / 2,
    yCenter: annotation.y + annotation.height / 2,
    width: annotation.width,
    height: annotation.height,
  };
}