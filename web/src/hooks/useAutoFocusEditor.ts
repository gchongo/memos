import { useEffect } from "react";
import type { RefObject } from "react";
import type { EditorController } from "@/components/MemoEditor/types/editorController";

/** Retry focus until the editor accepts it (needed on mobile after dialog mount). */
export function useAutoFocusEditor(
  editorRef: RefObject<EditorController | null>,
  enabled: boolean,
  ready: boolean,
) {
  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 15;

    const tryFocus = () => {
      if (cancelled) {
        return;
      }

      editorRef.current?.focus();
      const focused = editorRef.current?.hasFocus() ?? false;

      if (focused) {
        document.querySelector<HTMLInputElement>("[data-compose-focus-bridge]")?.blur();
      }

      if (!focused && attempt < maxAttempts) {
        attempt += 1;
        window.setTimeout(tryFocus, 50 + attempt * 40);
      }
    };

    tryFocus();

    return () => {
      cancelled = true;
    };
  }, [editorRef, enabled, ready]);
}
