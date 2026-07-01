import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { getNaturalMediaFitStyle } from "@/utils/naturalMediaFit";

interface InlineFeedVideoProps {
  sourceUrl: string;
  posterUrl?: string;
  alt: string;
  className?: string;
  /** Natural-size feed tile (matches single images); collage fills its grid cell. */
  variant?: "feed" | "collage";
}

const InlineFeedVideo = ({ sourceUrl, posterUrl, alt, className, variant = "feed" }: InlineFeedVideoProps) => {
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);

  const poster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;

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

  return (
    <div
      className={cn(
        "relative isolate block max-h-[20rem] overflow-hidden rounded-2xl bg-black",
        !mediaSize && "h-[12rem] w-full max-w-[20rem]",
        className,
      )}
      style={mediaSize ? getNaturalMediaFitStyle(mediaSize.width, mediaSize.height) : undefined}
    >
      <video
        src={sourceUrl}
        poster={poster}
        className="block h-full w-full rounded-2xl object-contain"
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
