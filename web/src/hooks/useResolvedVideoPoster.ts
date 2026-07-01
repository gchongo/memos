import { useEffect, useState } from "react";

const MAX_POSTER_DIMENSION = 960;
const POSTER_TIMEOUT_MS = 6_000;

const getFrameSourceUrl = (sourceUrl: string): string => {
  if (!sourceUrl || sourceUrl.startsWith("blob:") || sourceUrl.startsWith("data:") || sourceUrl.includes("#")) {
    return sourceUrl;
  }

  return `${sourceUrl}#t=0.001`;
};

const getCanvasSize = (width: number, height: number) => {
  const scale = Math.min(1, MAX_POSTER_DIMENSION / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

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

      timers.push(setTimeout(tryReject, 1_500));
    };

    timers.push(setTimeout(tryReject, POSTER_TIMEOUT_MS - 500));
  });

export const captureVideoFramePoster = (sourceUrl: string): Promise<string | undefined> =>
  withTimeout(
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.removeAttribute("src");
        video.load();
      };

      const finish = (poster?: string) => {
        cleanup();
        resolve(poster);
      };

      video.onerror = () => finish(undefined);
      video.src = getFrameSourceUrl(sourceUrl);

      void waitForVideoFrame(video)
        .then(() => {
          if (video.videoWidth <= 0 || video.videoHeight <= 0) {
            finish(undefined);
            return;
          }

          try {
            const { width, height } = getCanvasSize(video.videoWidth, video.videoHeight);
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d");
            if (!context) {
              finish(undefined);
              return;
            }

            context.drawImage(video, 0, 0, width, height);
            finish(canvas.toDataURL("image/jpeg", 0.86));
          } catch {
            finish(undefined);
          }
        })
        .catch(() => finish(undefined));
    }),
    POSTER_TIMEOUT_MS,
    undefined,
  );

const verifyPosterUrl = (posterUrl: string): Promise<boolean> =>
  withTimeout(
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = posterUrl;
    }),
    POSTER_TIMEOUT_MS,
    false,
  );

/** Resolve a poster URL for `<video poster>`: server thumbnail first, then client frame capture. */
export const useResolvedVideoPoster = (sourceUrl: string, posterUrl?: string): string | undefined => {
  const candidatePoster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;
  const [resolvedPoster, setResolvedPoster] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    setResolvedPoster(undefined);

    void (async () => {
      if (candidatePoster && (await verifyPosterUrl(candidatePoster))) {
        if (!cancelled) {
          setResolvedPoster(candidatePoster);
        }
        return;
      }

      const capturedPoster = await captureVideoFramePoster(sourceUrl);
      if (!cancelled) {
        setResolvedPoster(capturedPoster);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candidatePoster, sourceUrl]);

  return resolvedPoster;
};
