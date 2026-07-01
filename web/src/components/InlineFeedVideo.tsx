import { useCallback, useRef } from "react";
import { FEED_VIDEO_ROUNDED_CLASS } from "@/components/MemoMetadata/Attachment/attachmentVisualClasses";
import { usePauseVideoWhenHidden } from "@/hooks/usePauseVideoWhenHidden";
import { useResolvedVideoPoster } from "@/hooks/useResolvedVideoPoster";
import { cn } from "@/lib/utils";

interface InlineFeedVideoProps {
  sourceUrl: string;
  posterUrl?: string;
  alt: string;
  className?: string;
  /** Natural-size feed tile (matches single images); collage fills its grid cell. */
  variant?: "feed" | "collage";
}

const InlineFeedVideo = ({ sourceUrl, posterUrl, alt, className, variant = "feed" }: InlineFeedVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolvedPoster = useResolvedVideoPoster(sourceUrl, posterUrl, videoRef);
  usePauseVideoWhenHidden(videoRef);

  const blockDownloadMenu = useCallback((event: React.MouseEvent<HTMLVideoElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <video
      ref={videoRef}
      src={sourceUrl}
      poster={resolvedPoster}
      className={cn(
        FEED_VIDEO_ROUNDED_CLASS,
        variant === "collage" ? "h-full w-full object-cover" : "block max-h-[20rem] w-full max-w-full object-contain",
        className,
      )}
      controls
      controlsList="nodownload"
      playsInline
      preload="metadata"
      aria-label={alt}
      onContextMenu={blockDownloadMenu}
    />
  );
};

export default InlineFeedVideo;
