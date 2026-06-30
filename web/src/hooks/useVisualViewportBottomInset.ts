import { useEffect, useState } from "react";

export interface VisualViewportLayout {
  /** Distance from the layout viewport bottom to the visible viewport bottom. */
  bottomInset: number;
  /** Y coordinate of the visible viewport bottom (layout viewport origin). */
  visibleBottom: number;
  keyboardOpen: boolean;
}

const KEYBOARD_OPEN_THRESHOLD = 50;

export function useVisualViewportLayout(enabled = true): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>({
    bottomInset: 0,
    visibleBottom: typeof window !== "undefined" ? window.innerHeight : 0,
    keyboardOpen: false,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const update = () => {
      const bottomInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setLayout({
        bottomInset,
        visibleBottom: viewport.offsetTop + viewport.height,
        keyboardOpen: bottomInset > KEYBOARD_OPEN_THRESHOLD,
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [enabled]);

  return layout;
}

/** @deprecated Use useVisualViewportLayout instead. */
export function useVisualViewportBottomInset(enabled = true) {
  return useVisualViewportLayout(enabled).bottomInset;
}
