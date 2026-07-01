import { type RefObject, useEffect } from "react";

/** Pause playback when the element scrolls fully out of the viewport. */
export const usePauseVideoWhenHidden = (videoRef: RefObject<HTMLVideoElement | null>): void => {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting && !video.paused) {
        video.pause();
      }
    });

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoRef]);
};
