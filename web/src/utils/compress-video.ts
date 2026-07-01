import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.6";
const MAX_VIDEO_DIMENSION = 1280;
const POSTER_MAX_DIMENSION = 600;
const MAX_POSTER_BYTES = 512 * 1024;
const SKIP_BELOW_BYTES = 8 * 1024 * 1024;
const POSTER_JPEG_QUALITY = 0.82;
const MIN_VALID_VIDEO_BYTES = 32 * 1024;
const POSTER_TIMEOUT_MS = 6_000;
const VIDEO_PROBE_TIMEOUT_MS = 8_000;
const COMPRESS_TIMEOUT_MS = 180_000;

export interface VideoUploadPreparation {
  file: File;
  poster?: Uint8Array;
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

const replaceExtension = (filename: string, extension: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${base}${extension}`;
};

const toUint8Array = (data: string | Uint8Array): Uint8Array => (data instanceof Uint8Array ? data : new TextEncoder().encode(data));

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

const probeVideoDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      cleanup();
      if (width > 0 && height > 0) {
        resolve({ width, height });
        return;
      }
      reject(new Error("Missing video dimensions"));
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to read video metadata"));
    };

    video.src = url;
  });

const canPlayVideoFile = (file: File): Promise<boolean> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const finish = (ok: boolean) => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(ok);
    };

    video.onloadedmetadata = () => finish(true);
    video.onerror = () => finish(false);
    video.src = url;
  });

export const shouldCompressVideo = async (file: File): Promise<boolean> => {
  if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2)$/i.test(file.name)) {
    return false;
  }

  if (file.size <= SKIP_BELOW_BYTES) {
    try {
      const { width, height } = await withTimeout(probeVideoDimensions(file), VIDEO_PROBE_TIMEOUT_MS, { width: 0, height: 0 });
      if (width <= 0 || height <= 0) {
        return false;
      }
      return Math.max(width, height) > MAX_VIDEO_DIMENSION;
    } catch {
      return false;
    }
  }

  return true;
};

const loadFFmpeg = async (): Promise<FFmpeg> => {
  const ffmpeg = new FFmpeg();
  const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
};

const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = loadFFmpeg().then((instance) => {
      ffmpegInstance = instance;
      return instance;
    });
  }

  return ffmpegLoadPromise;
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

const compressWithFfmpeg = async (file: File, onProgress?: (ratio: number) => void): Promise<File | null> => {
  const ffmpeg = await getFFmpeg();
  const inputName = "input";
  const outputName = "output.mp4";

  const progressHandler = ({ progress }: { progress?: number }) => {
    if (typeof progress === "number" && Number.isFinite(progress)) {
      onProgress?.(Math.min(0.75, Math.max(0.1, progress)));
    }
  };

  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale=${MAX_VIDEO_DIMENSION}:${MAX_VIDEO_DIMENSION}:force_original_aspect_ratio=decrease`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "ultrafast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const output = await ffmpeg.readFile(outputName);
    const bytes = toUint8Array(output);
    if (bytes.byteLength < MIN_VALID_VIDEO_BYTES) {
      return null;
    }

    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const compressed = new File([buffer], replaceExtension(file.name, ".mp4"), {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    const playable = await withTimeout(canPlayVideoFile(compressed), VIDEO_PROBE_TIMEOUT_MS, false);
    if (!playable) {
      return null;
    }

    if (compressed.size >= file.size && file.type === "video/mp4") {
      return null;
    }

    return compressed;
  } catch {
    return null;
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
  }
};

/** Compress large videos when safe and extract a small JPEG poster from the first frame. */
export async function prepareVideoUpload(file: File, onProgress?: (ratio: number) => void): Promise<VideoUploadPreparation> {
  onProgress?.(0.05);

  // Poster from the original file first — never block upload on this step.
  let poster = await withTimeout(extractPosterWithCanvas(file), POSTER_TIMEOUT_MS, null);
  onProgress?.(0.2);

  let resultFile = file;
  if (await shouldCompressVideo(file)) {
    onProgress?.(0.25);
    const compressed = await withTimeout(compressWithFfmpeg(file, onProgress), COMPRESS_TIMEOUT_MS, null);
    if (compressed) {
      resultFile = compressed;
    }
  }

  onProgress?.(0.95);

  if (!poster && resultFile !== file) {
    poster = await withTimeout(extractPosterWithCanvas(resultFile), POSTER_TIMEOUT_MS, null);
  }

  onProgress?.(1);
  return { file: resultFile, poster: poster ?? undefined };
}

/** @deprecated Use {@link prepareVideoUpload} */
export async function compressVideoFile(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const result = await prepareVideoUpload(file, onProgress);
  return result.file;
}
