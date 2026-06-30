import { useCallback } from "react";
import { useInstance } from "@/contexts/InstanceContext";
import type { PreviewMediaItem } from "@/utils/media-item";

interface UseMemoHandlersOptions {
  readonly: boolean;
  openEditor: () => void;
  openPreview: (items: string | string[] | PreviewMediaItem[], index?: number) => void;
  suppressCardNavigation?: () => void;
}

export const useMemoHandlers = (options: UseMemoHandlersOptions) => {
  const { readonly, openEditor, openPreview, suppressCardNavigation } = options;
  const { memoRelatedSetting } = useInstance();

  const handleMemoContentClick = useCallback(
    (e: React.MouseEvent) => {
      const targetEl = e.target as HTMLElement;
      if (targetEl.tagName === "IMG") {
        const linkElement = targetEl.closest("a");
        if (linkElement) return;
        const imgUrl = targetEl.getAttribute("src");
        if (imgUrl) {
          e.stopPropagation();
          suppressCardNavigation?.();
          openPreview(imgUrl);
        }
      }
    },
    [openPreview, suppressCardNavigation],
  );

  const handleMemoContentDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (readonly) return;
      if (memoRelatedSetting.enableDoubleClickEdit) {
        e.preventDefault();
        openEditor();
      }
    },
    [readonly, openEditor, memoRelatedSetting.enableDoubleClickEdit],
  );

  return { handleMemoContentClick, handleMemoContentDoubleClick };
};
