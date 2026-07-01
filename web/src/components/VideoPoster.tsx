import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { POSTER_INTERSECTION_ROOT_MARGIN, resolveVideoPosterUrl } from "@/utils/video-poster";

interface VideoPosterProps {
  sourceUrl: string;
  alt: string;
  className?: string;
  posterUrl?: string;
}

const VideoPoster = ({ sourceUrl, alt, className, posterUrl }: VideoPosterProps) => {
  const candidatePoster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;
  const [posterImageUrl, setPosterImageUrl] = useState<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setPosterImageUrl(undefined);
  }, [sourceUrl, candidatePoster]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: POSTER_INTERSECTION_ROOT_MARGIN },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let cancelled = false;

    void resolveVideoPosterUrl(sourceUrl, candidatePoster).then((resolvedPoster) => {
      if (!cancelled) {
        setPosterImageUrl(resolvedPoster);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isVisible, sourceUrl, candidatePoster]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      {posterImageUrl ? (
        <img src={posterImageUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div data-testid="video-poster-placeholder" className="h-full w-full bg-muted/40" aria-label={alt} role="img" />
      )}
    </div>
  );
};

export default VideoPoster;
