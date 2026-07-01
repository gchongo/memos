import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Similar to X/Twitter feed video max height on mobile. */
const MAX_FEED_VIDEO_HEIGHT_PX = 560;

interface InlineFeedVideoProps {
  sourceUrl: string;
  posterUrl?: string;
  alt: string;
  className?: string;
  /** Full-width feed tile with intrinsic aspect ratio; collage fills its grid cell. */
  variant?: "feed" | "collage";
}

const InlineFeedVideo = ({ sourceUrl, posterUrl, alt, className, variant = "feed" }: InlineFeedVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const poster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;

  useEffect(() => {
    if (variant !== "feed" || !containerRef.current) {
      return;
    }

    const element = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, [variant]);

  const handleLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setMediaSize({ width: video.videoWidth, height: video.videoHeight });
    }
  }, []);

  const stopPropagation = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  if (variant === "collage") {
    return (
      <video
        src={sourceUrl}
        poster={poster}
        className={cn("h-full w-full object-cover", className)}
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={stopPropagation}
        onPointerDown={stopPropagation}
      />
    );
  }

  const layoutHeight =
    mediaSize && containerWidth > 0
      ? Math.min(containerWidth / (mediaSize.width / mediaSize.height), MAX_FEED_VIDEO_HEIGHT_PX)
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden bg-black", className)}
      style={layoutHeight ? { height: layoutHeight } : { aspectRatio: "16 / 9" }}
    >
      <video
        src={sourceUrl}
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={stopPropagation}
        onPointerDown={stopPropagation}
      />
    </div>
  );
};

export default InlineFeedVideo;
