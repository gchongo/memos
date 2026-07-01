import { type RefObject, useEffect, useState } from "react";
import { POSTER_INTERSECTION_ROOT_MARGIN, resolveVideoPosterUrl } from "@/utils/video-poster";

const useElementVisible = (elementRef: RefObject<Element | null>, rootMargin = POSTER_INTERSECTION_ROOT_MARGIN): boolean => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
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
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, rootMargin]);

  return isVisible;
};

/** Resolve a poster URL for `<video poster>` when the element enters the viewport. */
export const useResolvedVideoPoster = (
  sourceUrl: string,
  posterUrl: string | undefined,
  elementRef: RefObject<Element | null>,
): string | undefined => {
  const candidatePoster = posterUrl && posterUrl !== sourceUrl ? posterUrl : undefined;
  const [resolvedPoster, setResolvedPoster] = useState<string | undefined>();
  const isVisible = useElementVisible(elementRef);

  useEffect(() => {
    setResolvedPoster(undefined);
  }, [sourceUrl, candidatePoster]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const poster = await resolveVideoPosterUrl(sourceUrl, candidatePoster);
      if (!cancelled) {
        setResolvedPoster(poster);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVisible, sourceUrl, candidatePoster]);

  return resolvedPoster;
};
