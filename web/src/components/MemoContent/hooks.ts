import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { COMPACT_STATES, estimateContentNeedsCompact, getCompactTriggerHeightPx, shouldCompactContent } from "./constants";
import type { ContentCompactView } from "./types";

const REMEASURE_DELAYS_MS = [0, 50, 200, 600];

export const useCompactMode = (enabled: boolean, content: string) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ContentCompactView | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setMode(undefined);
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];

    const measure = () => {
      if (cancelled || !containerRef.current) {
        return;
      }

      const target = containerRef.current;
      const contentHeight = Math.max(target.scrollHeight, target.getBoundingClientRect().height);
      const triggerHeight = getCompactTriggerHeightPx();
      const shouldCompact = estimateContentNeedsCompact(content) || shouldCompactContent(contentHeight, triggerHeight);

      setMode((currentMode) => {
        if (!shouldCompact) {
          return undefined;
        }
        return currentMode ?? "ALL";
      });
    };

    measure();

    for (const delay of REMEASURE_DELAYS_MS) {
      timeouts.push(window.setTimeout(measure, delay));
    }

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(element);
    }

    let mutationObserver: MutationObserver | undefined;
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(measure);
      mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      cancelled = true;
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [enabled, content]);

  const toggle = useCallback(
    (event?: PointerEvent) => {
      event?.stopPropagation();
      event?.preventDefault();
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
