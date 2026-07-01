import { create } from "@bufbuild/protobuf";
import { useCallback, useRef } from "react";
import { type MotionMedia, MotionMediaFamily, MotionMediaRole, MotionMediaSchema } from "@/types/proto/api/v1/attachment_service_pb";
import type { LocalFile } from "../types/attachment";
import { useBlobUrls } from "./useBlobUrls";

/** Document / cloud file picker — excludes photos, videos, and audio. */
export const DOCUMENT_FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.zip,.rar,.7z,.gz,application/*,text/*";

const VIDEO_FILE_EXTENSION_RE = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2)$/i;
const AUDIO_FILE_EXTENSION_RE = /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i;

export function inferMimeTypeFromFilename(filename: string): string | undefined {
  if (VIDEO_FILE_EXTENSION_RE.test(filename)) {
    return "video/mp4";
  }
  if (AUDIO_FILE_EXTENSION_RE.test(filename)) {
    return "audio/mpeg";
  }
  return undefined;
}

export const isImageFile = (file: File) => file.type.startsWith("image/");

export const isVideoFile = (file: File) => file.type.startsWith("video/") || VIDEO_FILE_EXTENSION_RE.test(file.name);

export const isAudioFile = (file: File) => file.type.startsWith("audio/");

export const isDocumentFile = (file: File) => !isImageFile(file) && !isVideoFile(file) && !isAudioFile(file);

/** Gallery/camera picks: images and videos, plus paired live-photo video when selected together. */
export function filterPhotoPickerFiles(files: File[]): File[] {
  const images = files.filter(isImageFile);
  const videos = files.filter(isVideoFile);

  if (images.length === 0) {
    return videos;
  }

  if (images.length === 1 && videos.length === 1) {
    return [images[0], videos[0]];
  }

  return [...images, ...videos];
}

export const useFileUpload = (onFilesSelected: (localFiles: LocalFile[]) => void) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const selectingFlagRef = useRef(false);
  const { createBlobUrl } = useBlobUrls();

  const emitFiles = useCallback(
    (files: File[], filter?: (file: File) => boolean) => {
      const selected = filter ? files.filter(filter) : files;
      if (selected.length === 0 || selectingFlagRef.current) {
        return;
      }

      selectingFlagRef.current = true;
      const localFiles: LocalFile[] = pairAppleLivePhotoFiles(
        selected.map((file) => ({
          file,
          previewUrl: createBlobUrl(file),
          origin: "upload" as const,
        })),
      );
      onFilesSelected(localFiles);
      selectingFlagRef.current = false;
    },
    [createBlobUrl, onFilesSelected],
  );

  const handleFileInputChange = useCallback(
    (filter?: (file: File) => boolean) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      emitFiles(files, filter);
      event.target.value = "";
    },
    [emitFiles],
  );

  const handlePhotoInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      emitFiles(filterPhotoPickerFiles(files));
      event.target.value = "";
    },
    [emitFiles],
  );

  const handleImageUploadClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleDocumentUploadClick = useCallback(() => {
    documentInputRef.current?.click();
  }, []);

  const handleAttachmentUploadClick = useCallback(() => {
    attachmentInputRef.current?.click();
  }, []);

  /** @deprecated Use handleImageUploadClick / handleDocumentUploadClick instead. */
  const handleUploadClick = (accept = "*") => {
    if (!attachmentInputRef.current) {
      return;
    }
    attachmentInputRef.current.accept = accept;
    attachmentInputRef.current.click();
  };

  return {
    imageInputRef,
    documentInputRef,
    attachmentInputRef,
    selectingFlag: selectingFlagRef.current,
    handleImageUploadClick,
    handleDocumentUploadClick,
    handleAttachmentUploadClick,
    handlePhotoInputChange,
    handleFileInputChange,
    handleUploadClick,
  };
};

const pairAppleLivePhotoFiles = (localFiles: LocalFile[]): LocalFile[] => {
  const stemMap = new Map<string, LocalFile[]>();
  for (const localFile of localFiles) {
    const stem = normalizeFilenameStem(localFile.file.name);
    const group = stemMap.get(stem) ?? [];
    group.push(localFile);
    stemMap.set(stem, group);
  }

  const groupIds = new Map<string, string>();
  return localFiles.map((localFile) => {
    const stem = normalizeFilenameStem(localFile.file.name);
    const group = stemMap.get(stem) ?? [];
    const images = group.filter((item) => isImageFile(item.file));
    const videos = group.filter((item) => isVideoFile(item.file));
    if (images.length !== 1 || videos.length !== 1) {
      return localFile;
    }

    const image = images[0];
    const video = videos[0];
    const groupId = groupIds.get(stem) ?? `${stem}-${crypto.randomUUID()}`;
    groupIds.set(stem, groupId);
    if (localFile.previewUrl === image.previewUrl) {
      return { ...localFile, motionMedia: buildLocalMotionMedia(groupId, MotionMediaRole.STILL) };
    }
    if (localFile.previewUrl === video.previewUrl) {
      return { ...localFile, motionMedia: buildLocalMotionMedia(groupId, MotionMediaRole.VIDEO) };
    }
    return localFile;
  });
};

const buildLocalMotionMedia = (groupId: string, role: MotionMediaRole): MotionMedia =>
  create(MotionMediaSchema, {
    family: MotionMediaFamily.APPLE_LIVE_PHOTO,
    role,
    groupId,
    presentationTimestampUs: 0n,
    hasEmbeddedVideo: false,
  });

const normalizeFilenameStem = (filename: string): string => {
  const parts = filename.split(".");
  if (parts.length <= 1) {
    return filename.toLowerCase();
  }
  return parts.slice(0, -1).join(".").toLowerCase();
};
