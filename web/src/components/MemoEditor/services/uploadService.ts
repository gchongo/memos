import { create } from "@bufbuild/protobuf";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { AttachmentSchema, MotionMediaSchema } from "@/types/proto/api/v1/attachment_service_pb";
import { compressImageFile } from "@/utils/compress-image";
import { prepareVideoUpload } from "@/utils/compress-video";
import { sendConnectUpload } from "@/utils/connectUnaryUpload";
import { encodeCreateAttachmentUpload, generateAttachmentUploadId } from "@/utils/encodeCreateAttachmentUpload";
import { inferMimeTypeFromFilename, isVideoFile } from "../hooks/useFileUpload";
import type { LocalFile } from "../types/attachment";
import { reportUploadProgress, type UploadProgressCallback } from "./uploadProgress";

const CREATE_ATTACHMENT_PROCEDURE = "/memos.api.v1.AttachmentService/CreateAttachment";

const prepareUploadFile = async (
  localFile: LocalFile,
  fileIndex: number,
  fileCount: number,
  onProgress?: UploadProgressCallback,
): Promise<{ file: File; thumbnail?: Uint8Array }> => {
  let { file, motionMedia } = localFile;
  const mimeType = file.type || inferMimeTypeFromFilename(file.name) || "application/octet-stream";

  if (mimeType.startsWith("image/")) {
    reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "compressing", 0);
    file = await compressImageFile(file);
    reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "compressing", 1);
    return { file };
  }

  if (isVideoFile(file) && !motionMedia) {
    reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "compressing", 0);
    const prepared = await prepareVideoUpload(file, (ratio) => {
      reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "compressing", ratio);
    });
    reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "compressing", 1);
    return { file: prepared.file, thumbnail: prepared.poster };
  }

  return { file };
};

const isRetryableUploadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : "";
  return message === "Network error during upload" || message === "Upload timed out";
};

const uploadPreparedFile = async (
  file: File,
  motionMedia: LocalFile["motionMedia"],
  thumbnail: Uint8Array | undefined,
  fileIndex: number,
  fileCount: number,
  onProgress?: UploadProgressCallback,
): Promise<Attachment> => {
  const mimeType = file.type || inferMimeTypeFromFilename(file.name) || "application/octet-stream";
  const attachmentId = generateAttachmentUploadId();

  reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "uploading", 0);

  const body = await encodeCreateAttachmentUpload({
    attachmentId,
    filename: file.name,
    mimeType,
    file,
    thumbnail,
    motionMedia: motionMedia ? create(MotionMediaSchema, motionMedia) : undefined,
  });

  const reportProgress = (loaded: number, total: number) => {
    reportUploadProgress(onProgress, fileIndex, fileCount, file.name, "uploading", total > 0 ? loaded / total : 0);
  };

  try {
    return await sendConnectUpload(CREATE_ATTACHMENT_PROCEDURE, AttachmentSchema, body, reportProgress);
  } catch (error) {
    if (!isRetryableUploadError(error)) {
      throw error;
    }

    return await sendConnectUpload(CREATE_ATTACHMENT_PROCEDURE, AttachmentSchema, body, reportProgress);
  }
};

export const uploadService = {
  async uploadFiles(localFiles: LocalFile[], onProgress?: UploadProgressCallback): Promise<Attachment[]> {
    if (localFiles.length === 0) {
      return [];
    }

    const attachments: Attachment[] = [];

    for (const [fileIndex, localFile] of localFiles.entries()) {
      const prepared = await prepareUploadFile(localFile, fileIndex, localFiles.length, onProgress);
      const attachment = await uploadPreparedFile(
        prepared.file,
        localFile.motionMedia,
        prepared.thumbnail,
        fileIndex,
        localFiles.length,
        onProgress,
      );
      attachments.push(attachment);
    }

    onProgress?.({
      phase: "uploading",
      percent: 100,
      fileIndex: localFiles.length,
      fileCount: localFiles.length,
      filename: localFiles.at(-1)?.file.name ?? "",
    });

    return attachments;
  },
};

export type { UploadProgressCallback, UploadProgressUpdate } from "./uploadProgress";
