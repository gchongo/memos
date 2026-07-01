import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.6";
const MAX_VIDEO_DIMENSION = 1280;
const POSTER_MAX_DIMENSION = 600;
const MAX_POSTER_BYTES = 512 * 1024;
const SKIP_BELOW_BYTES = 8 * 1024 * 1024;
const POSTER_JPEG_QUALITY = 0.82;

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

export const shouldCompressVideo = async (file: File): Promise<boolean> => {
  if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2)$/i.test(file.name)) {
    return false;
  }

  if (file.size <= SKIP_BELOW_BYTES) {
    try {
      const { width, height } = await probeVideoDimensions(file);
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

const extractPosterWithFfmpeg = async (ffmpeg: FFmpeg, inputName: string): Promise<Uint8Array | null> => {
  const posterName = "poster.jpg";

  try {
    await ffmpeg.exec([
      "-ss",
      "0",
      "-i",
      inputName,
      "-vframes",
      "1",
      "-vf",
      `scale=${POSTER_MAX_DIMENSION}:${POSTER_MAX_DIMENSION}:force_original_aspect_ratio=decrease`,
      "-q:v",
      "8",
      posterName,
    ]);

    const output = await ffmpeg.readFile(posterName);
    const bytes = toUint8Array(output);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_POSTER_BYTES) {
      return null;
    }
    return bytes;
  } catch {
    return null;
  } finally {
    await ffmpeg.deleteFile(posterName).catch(() => undefined);
  }
};

const extractPosterWithCanvas = async (file: File): Promise<Uint8Array | null> => {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error("Failed to decode video frame"));
      video.onerror = fail;
      video.onloadeddata = () => {
        video.currentTime = 0.001;
      };
      video.onseeked = () => resolve();
      video.src = url;
    });

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

/** Compress video when needed and extract a small JPEG poster from the first frame. */
export async function prepareVideoUpload(file: File, onProgress?: (ratio: number) => void): Promise<VideoUploadPreparation> {
  const shouldCompress = await shouldCompressVideo(file);

  try {
    const ffmpeg = await getFFmpeg();
    const inputName = "input";
    const outputName = "output.mp4";
    let resultFile = file;
    let posterSource = inputName;

    const progressHandler = ({ progress }: { progress?: number }) => {
      if (typeof progress === "number" && Number.isFinite(progress)) {
        onProgress?.(Math.min(0.9, Math.max(0, progress)));
      }
    };

    ffmpeg.on("progress", progressHandler);

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (shouldCompress) {
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
        const buffer = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buffer).set(bytes);
        const compressed = new File([buffer], replaceExtension(file.name, ".mp4"), {
          type: "video/mp4",
          lastModified: Date.now(),
        });

        if (compressed.size < file.size || file.type !== "video/mp4") {
          resultFile = compressed;
          posterSource = outputName;
        }
      }

      const poster =
        (await extractPosterWithFfmpeg(ffmpeg, posterSource)) ??
        (await extractPosterWithCanvas(resultFile)) ??
        (await extractPosterWithCanvas(file));
      onProgress?.(1);
      return { file: resultFile, poster: poster ?? undefined };
    } finally {
      ffmpeg.off("progress", progressHandler);
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
    }
  } catch {
    const poster = await extractPosterWithCanvas(file);
    onProgress?.(1);
    return { file, poster: poster ?? undefined };
  }
}

/** @deprecated Use {@link prepareVideoUpload} */
export async function compressVideoFile(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const result = await prepareVideoUpload(file, onProgress);
  return result.file;
}
