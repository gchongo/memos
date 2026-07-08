import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { COMPACT_STATES, getCompactTriggerHeightPx, shouldCompactContent } from "./constants";
import type { ContentCompactView } from "./types";

export const useCompactMode = (enabled: boolean, revision: string) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ContentCompactView | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      setMode(undefined);
      return;
    }

    const element = containerRef.current;

    const measure = () => {
      const contentHeight = Math.max(element.scrollHeight, element.getBoundingClientRect().height);
      const shouldCompact = shouldCompactContent(contentHeight, getCompactTriggerHeightPx());
      setMode((currentMode) => {
        if (!shouldCompact) {
          return undefined;
        }
        return currentMode ?? "ALL";
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, revision]);

  const toggle = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation();
      if (!mode) return;
      setMode(COMPACT_STATES[mode].next);
    },
    [mode],
  );

  return { containerRef, mode, toggle };
};

export const useCompactLabel = (mode: ContentCompactView | undefined, t: (key: string) => string): string => {
  if (!mode) return "";
  return t(COMPACT_STATES[mode].textKey);
};
