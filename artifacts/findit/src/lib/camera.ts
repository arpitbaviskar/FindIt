export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export async function processImageFile(file: File, maxDimension = 1600): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
  const source = await readAsDataUrl(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = source;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('That image could not be opened.'));
  });

  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error('That image has no usable dimensions.');

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return { dataUrl: source, width: sourceWidth, height: sourceHeight, sourceWidth, sourceHeight };
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    width,
    height,
    sourceWidth,
    sourceHeight,
  };
}

export async function resizeImageFile(file: File, maxDimension = 1280): Promise<string> {
  return (await processImageFile(file, maxDimension)).dataUrl;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That image could not be read.'));
    reader.readAsDataURL(file);
  });
}