import { useCallback, useEffect, useState } from "react";

const MAX_POSTER_DIMENSION = 960;

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

export const captureVideoFramePoster = (sourceUrl: string): Promise<string | undefined> =>
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
    video.onloadeddata = () => {
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
    };

    video.src = getFrameSourceUrl(sourceUrl);
  });

const verifyPosterUrl = (posterUrl: string): Promise<boolean> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = posterUrl;
  });

/** Resolve a poster URL for `<video poster>`: server thumbnail first, then client frame capture. */
export const useResolvedVideoPoster = (sourceUrl: string, posterUrl?: string): string | undefined => {
  const candidatePoster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;
  const [resolvedPoster, setResolvedPoster] = useState<string | undefined>();

  const resolvePoster = useCallback(async () => {
    if (candidatePoster && (await verifyPosterUrl(candidatePoster))) {
      setResolvedPoster(candidatePoster);
      return;
    }

    const capturedPoster = await captureVideoFramePoster(sourceUrl);
    setResolvedPoster(capturedPoster);
  }, [candidatePoster, sourceUrl]);

  useEffect(() => {
    setResolvedPoster(undefined);
    void resolvePoster();
  }, [resolvePoster]);

  return resolvedPoster;
};
