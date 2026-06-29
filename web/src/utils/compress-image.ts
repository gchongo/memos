/** Longest edge cap for uploaded photos (keeps detail on mobile screens). */
const MAX_IMAGE_DIMENSION = 1920;

/** JPEG quality for photo uploads (balance size vs. clarity). */
const JPEG_QUALITY = 0.82;

/** Skip compression when the file is already small enough. */
const SKIP_BELOW_BYTES = 180 * 1024;

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/heic",
  "image/heif",
]);

function scaleDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function replaceExtension(filename: string, extension: string): string {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${base}${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/** Sample pixels to detect transparency without scanning every pixel. */
function hasTransparentPixels(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const step = Math.max(1, Math.floor(Math.sqrt(width * height) / 120));
  const { data } = ctx.getImageData(0, 0, width, height);

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 250) {
        return true;
      }
    }
  }

  return false;
}

async function compressWithCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  try {
    const { width, height } = scaleDimensions(bitmap.width, bitmap.height, MAX_IMAGE_DIMENSION);
    const needsResize = width !== bitmap.width || height !== bitmap.height;
    const canSkip = !needsResize && file.size <= SKIP_BELOW_BYTES;

    if (canSkip) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Canvas not supported");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const keepPng = file.type === "image/png" && hasTransparentPixels(ctx, width, height);
    const outputType = keepPng ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outputType, keepPng ? undefined : JPEG_QUALITY);
    const outputName = keepPng ? replaceExtension(file.name, ".png") : replaceExtension(file.name, ".jpg");

    return new File([blob], outputName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

/** Compress raster images before upload; returns the original file when compression is unnecessary or unsupported. */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  const normalizedType = file.type.toLowerCase();
  const isKnownPhoto =
    COMPRESSIBLE_IMAGE_TYPES.has(normalizedType) || normalizedType === "image/jpeg" || normalizedType === "image/pjpeg";
  if (!isKnownPhoto && !normalizedType.startsWith("image/")) {
    return file;
  }

  try {
    const compressed = await compressWithCanvas(file);
    if (compressed.size >= file.size && compressed.type === file.type) {
      return file;
    }
    return compressed;
  } catch {
    return file;
  }
}
