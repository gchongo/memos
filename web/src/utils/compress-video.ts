const POSTER_MAX_DIMENSION = 600;
const MAX_POSTER_BYTES = 512 * 1024;
const POSTER_JPEG_QUALITY = 0.82;
const POSTER_TIMEOUT_MS = 6_000;

export interface VideoUploadPreparation {
  file: File;
  poster?: Uint8Array;
}

const scaleDimensions = (width: number, height: number, maxDimension: number) => {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const ratio = maxDimension / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode poster"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
};

const waitForVideoFrame = (video: HTMLVideoElement): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const clearTimers = () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.length = 0;
    };

    const tryResolve = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimers();
      resolve();
    };

    const tryReject = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimers();
      reject(new Error("Failed to decode video frame"));
    };

    video.onerror = tryReject;

    video.onloadeddata = () => {
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        tryReject();
        return;
      }

      const seekTarget = Math.min(0.05, Math.max(0.001, (video.duration || 1) * 0.01));
      if (seekTarget <= 0.001 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        tryResolve();
        return;
      }

      video.onseeked = tryResolve;
      try {
        video.currentTime = seekTarget;
      } catch {
        tryResolve();
        return;
      }

      timers.push(setTimeout(tryResolve, 1_500));
    };

    timers.push(setTimeout(tryReject, POSTER_TIMEOUT_MS - 500));
  });

const extractPosterWithCanvas = async (file: File): Promise<Uint8Array | null> => {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  try {
    video.src = url;
    await waitForVideoFrame(video);

    const { width, height } = scaleDimensions(video.videoWidth, video.videoHeight, POSTER_MAX_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", POSTER_JPEG_QUALITY);
    const buffer = new Uint8Array(await blob.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_POSTER_BYTES) {
      return null;
    }
    return buffer;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
};

/** Upload the original video and optionally attach a small JPEG poster. Never re-encode video in the browser. */
export async function prepareVideoUpload(file: File, onProgress?: (ratio: number) => void): Promise<VideoUploadPreparation> {
  onProgress?.(0.2);
  const poster = await withTimeout(extractPosterWithCanvas(file), POSTER_TIMEOUT_MS, null);
  onProgress?.(1);
  return { file, poster: poster ?? undefined };
}

/** @deprecated Use {@link prepareVideoUpload} */
export async function compressVideoFile(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const result = await prepareVideoUpload(file, onProgress);
  return result.file;
}

export async function shouldCompressVideo(_file: File): Promise<boolean> {
  return false;
}
