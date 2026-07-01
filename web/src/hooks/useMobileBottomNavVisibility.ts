import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_DELTA_THRESHOLD = 8;
const TOP_REVEAL_OFFSET = 48;

/**
 * Hides the mobile bottom nav while scrolling down and reveals it when scrolling up.
 * Always visible near the top of the page and after route changes.
 */
export const useMobileBottomNavVisibility = (enabled: boolean) => {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(true);
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }

    lastScrollY.current = window.scrollY;

    const updateVisibility = () => {
      const currentY = window.scrollY;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const pageCanScroll = scrollHeight > viewportHeight + TOP_REVEAL_OFFSET;

      if (!pageCanScroll) {
        setVisible(true);
        lastScrollY.current = currentY;
        ticking.current = false;
        return;
      }

      const delta = currentY - lastScrollY.current;

      if (currentY <= TOP_REVEAL_OFFSET) {
        setVisible(true);
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setVisible(false);
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) {
        return;
      }
      ticking.current = true;
      requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return visible;
};
