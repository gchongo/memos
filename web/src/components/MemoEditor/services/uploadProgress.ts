export type UploadProgressPhase = "compressing" | "uploading";

export interface UploadProgressUpdate {
  phase: UploadProgressPhase;
  percent: number;
  fileIndex: number;
  fileCount: number;
  filename: string;
}

export type UploadProgressCallback = (update: UploadProgressUpdate) => void;

const COMPRESS_SHARE = 0.55;
const UPLOAD_SHARE = 0.45;

export const reportUploadProgress = (
  callback: UploadProgressCallback | undefined,
  fileIndex: number,
  fileCount: number,
  filename: string,
  phase: UploadProgressPhase,
  phaseProgress: number,
) => {
  if (!callback || fileCount <= 0) {
    return;
  }

  const fileSlice = 1 / fileCount;
  const fileBase = fileIndex / fileCount;
  const inner = phase === "compressing" ? phaseProgress * COMPRESS_SHARE : COMPRESS_SHARE + phaseProgress * UPLOAD_SHARE;

  callback({
    phase,
    percent: Math.min(100, Math.round((fileBase + inner * fileSlice) * 100)),
    fileIndex: fileIndex + 1,
    fileCount,
    filename,
  });
};
