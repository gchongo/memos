import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.6";
const MAX_VIDEO_DIMENSION = 1280;
const SKIP_BELOW_BYTES = 8 * 1024 * 1024;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

const replaceExtension = (filename: string, extension: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${base}${extension}`;
};

const probeVideoDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

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

/** Compress feed-oriented video uploads to H.264 MP4 (~720p). Returns the original file when skipped or on failure. */
export async function compressVideoFile(file: File, onProgress?: (ratio: number) => void): Promise<File> {
  const shouldCompress = await shouldCompressVideo(file);
  if (!shouldCompress) {
    onProgress?.(1);
    return file;
  }

  try {
    const ffmpeg = await getFFmpeg();
    const inputName = "input";
    const outputName = "output.mp4";

    const progressHandler = ({ progress }: { progress?: number }) => {
      if (typeof progress === "number" && Number.isFinite(progress)) {
        onProgress?.(Math.min(1, Math.max(0, progress)));
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
      const bytes = output instanceof Uint8Array ? output : new TextEncoder().encode(String(output));
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const compressed = new File([buffer], replaceExtension(file.name, ".mp4"), {
        type: "video/mp4",
        lastModified: Date.now(),
      });

      if (compressed.size >= file.size && file.type === "video/mp4") {
        return file;
      }

      onProgress?.(1);
      return compressed;
    } finally {
      ffmpeg.off("progress", progressHandler);
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
    }
  } catch {
    onProgress?.(1);
    return file;
  }
}
