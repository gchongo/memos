export const FEED_POSTER_MAX_DIMENSION = 960;
export const UPLOAD_POSTER_MAX_DIMENSION = 600;
export const UPLOAD_POSTER_JPEG_QUALITY = 0.82;
export const UPLOAD_POSTER_MAX_BYTES = 512 * 1024;
export const POSTER_TIMEOUT_MS = 6_000;
export const POSTER_CAPTURE_CONCURRENCY = 2;
export const POSTER_INTERSECTION_ROOT_MARGIN = "200px";

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
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

export const getFrameSourceUrl = (sourceUrl: string): string => {
  if (!sourceUrl || sourceUrl.startsWith("blob:") || sourceUrl.startsWith("data:") || sourceUrl.includes("#")) {
    return sourceUrl;
  }

  return `${sourceUrl}#t=0.001`;
};

export const scalePosterDimensions = (width: number, height: number, maxDimension: number) => {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const waitForVideoFrame = (video: HTMLVideoElement, timeoutMs = POSTER_TIMEOUT_MS): Promise<void> =>
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

      timers.push(setTimeout(tryReject, 1_500));
    };

    timers.push(setTimeout(tryReject, timeoutMs - 500));
  });

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

const drawVideoFrameToCanvas = (video: HTMLVideoElement, maxDimension: number): HTMLCanvasElement | null => {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    return null;
  }

  const { width, height } = scalePosterDimensions(video.videoWidth, video.videoHeight, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, width, height);
  return canvas;
};

let activePosterCaptures = 0;
const posterCaptureWaiters: Array<() => void> = [];

const acquirePosterCaptureSlot = (): Promise<void> => {
  if (activePosterCaptures < POSTER_CAPTURE_CONCURRENCY) {
    activePosterCaptures += 1;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    posterCaptureWaiters.push(() => {
      activePosterCaptures += 1;
      resolve();
    });
  });
};

const releasePosterCaptureSlot = () => {
  activePosterCaptures = Math.max(0, activePosterCaptures - 1);
  const next = posterCaptureWaiters.shift();
  next?.();
};

export const runPosterCapture = async <T>(task: () => Promise<T>): Promise<T> => {
  await acquirePosterCaptureSlot();
  try {
    return await task();
  } finally {
    releasePosterCaptureSlot();
  }
};

const captureFrameFromVideoElement = async (
  video: HTMLVideoElement,
  maxDimension: number,
  jpegQuality: number,
): Promise<string | undefined> => {
  await waitForVideoFrame(video);

  const canvas = drawVideoFrameToCanvas(video, maxDimension);
  if (!canvas) {
    return undefined;
  }

  try {
    return canvas.toDataURL("image/jpeg", jpegQuality);
  } catch {
    return undefined;
  }
};

export const captureVideoFramePoster = (sourceUrl: string): Promise<string | undefined> =>
  withTimeout(
    runPosterCapture(async () => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;

      try {
        video.src = getFrameSourceUrl(sourceUrl);
        return await captureFrameFromVideoElement(video, FEED_POSTER_MAX_DIMENSION, 0.86);
      } catch {
        return undefined;
      } finally {
        video.removeAttribute("src");
        video.load();
      }
    }),
    POSTER_TIMEOUT_MS,
    undefined,
  );

export const extractPosterBytesFromFile = async (file: File): Promise<Uint8Array | null> =>
  runPosterCapture(async () => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    try {
      video.src = url;
      await waitForVideoFrame(video);

      const canvas = drawVideoFrameToCanvas(video, UPLOAD_POSTER_MAX_DIMENSION);
      if (!canvas) {
        return null;
      }

      const blob = await canvasToBlob(canvas, "image/jpeg", UPLOAD_POSTER_JPEG_QUALITY);
      const buffer = new Uint8Array(await blob.arrayBuffer());
      if (buffer.byteLength === 0 || buffer.byteLength > UPLOAD_POSTER_MAX_BYTES) {
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
  });

export const verifyPosterUrl = async (posterUrl: string): Promise<boolean> => {
  try {
    const response = await withTimeout(
      fetch(posterUrl, {
        method: "HEAD",
        credentials: "include",
      }),
      POSTER_TIMEOUT_MS,
      null as Response | null,
    );

    if (!response?.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
};

export const resolveVideoPosterUrl = async (sourceUrl: string, posterUrl?: string): Promise<string | undefined> => {
  const candidatePoster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;
  if (candidatePoster && (await verifyPosterUrl(candidatePoster))) {
    return candidatePoster;
  }

  return captureVideoFramePoster(sourceUrl);
};
