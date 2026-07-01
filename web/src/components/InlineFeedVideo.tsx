import { useCallback } from "react";
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
  const resolvedPoster = useResolvedVideoPoster(sourceUrl, posterUrl);

  const stopPropagation = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <video
      src={sourceUrl}
      poster={resolvedPoster}
      className={cn(
        variant === "collage" ? "h-full w-full object-cover" : "block max-h-[20rem] w-full max-w-full object-contain",
        className,
      )}
      controls
      playsInline
      preload="metadata"
      aria-label={alt}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
    />
  );
};

export default InlineFeedVideo;
