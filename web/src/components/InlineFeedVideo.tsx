import { cn } from "@/lib/utils";

interface InlineFeedVideoProps {
  sourceUrl: string;
  posterUrl?: string;
  alt: string;
  className?: string;
}

const InlineFeedVideo = ({ sourceUrl, posterUrl, alt, className }: InlineFeedVideoProps) => {
  const poster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;

  return (
    <video
      src={sourceUrl}
      poster={poster}
      className={cn("w-full bg-black/5", className)}
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
