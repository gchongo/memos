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
  const poster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;

  return (
    <video
      src={sourceUrl}
      poster={poster}
      className={cn(
        variant === "collage" ? "h-full w-full object-cover" : "block max-h-[20rem] w-full max-w-full object-contain",
        className,
      )}
      controls
      playsInline
      preload="metadata"
      aria-label={alt}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
};

export default InlineFeedVideo;
