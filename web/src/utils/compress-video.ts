import { extractPosterBytesFromFile, POSTER_TIMEOUT_MS, withTimeout } from "@/utils/video-poster";

export interface VideoUploadPreparation {
  file: File;
  poster?: Uint8Array;
}

/** Upload the original video and optionally attach a small JPEG poster. Never re-encode video in the browser. */
export async function prepareVideoUpload(file: File, onProgress?: (ratio: number) => void): Promise<VideoUploadPreparation> {
  onProgress?.(0.2);
  const poster = await withTimeout(extractPosterBytesFromFile(file), POSTER_TIMEOUT_MS, null);
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
