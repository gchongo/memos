import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { getAttachmentThumbnailUrl, getAttachmentType, getAttachmentUrl } from "@/utils/attachment";
import { usePauseVideoWhenHidden } from "@/hooks/usePauseVideoWhenHidden";

interface AttachmentCardProps {
  attachment: Attachment;
  onClick?: () => void;
  className?: string;
}

const VideoAttachmentCard = ({ sourceUrl, className }: { sourceUrl: string; className?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  usePauseVideoWhenHidden(videoRef);

  return (
    <video
      ref={videoRef}
      src={sourceUrl}
      className={cn("w-full h-full object-cover rounded-lg", className)}
      controls
      controlsList="nodownload"
      preload="metadata"
      onContextMenu={(event) => event.preventDefault()}
    />
  );
};

const AttachmentCard = ({ attachment, onClick, className }: AttachmentCardProps) => {
  const attachmentType = getAttachmentType(attachment);
  const sourceUrl = getAttachmentUrl(attachment);

  if (attachmentType === "image/*") {
    return (
      <img
        src={getAttachmentThumbnailUrl(attachment)}
        alt={attachment.filename}
        className={cn("w-full h-full object-cover rounded-lg cursor-pointer", className)}
        onClick={onClick}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.includes("?thumbnail=true")) {
            target.src = sourceUrl;
          }
        }}
        decoding="async"
        loading="lazy"
      />
    );
  }

  if (attachmentType === "video/*") {
    return <VideoAttachmentCard sourceUrl={sourceUrl} className={className} />;
  }

  if (attachmentType === "audio/*") {
    return <audio src={sourceUrl} className={cn("w-full rounded-lg", className)} controls preload="metadata" />;
  }

  return null;
};

export default AttachmentCard;
