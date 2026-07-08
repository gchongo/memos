import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { extractMentionUsernames } from "@/utils/remark-plugins/remark-mention";
import { COMPACT_MODE_CONFIG, getPreviewMaxHeightPx } from "./constants";
import { useCompactLabel, useCompactMode } from "./hooks";
import { MemoMarkdownRenderer } from "./MemoMarkdownRenderer";
import { useResolvedMentionUsernames } from "./MentionResolutionContext";
import type { MemoContentProps } from "./types";

const showMoreButtonClass =
  "inline-flex min-h-11 items-center py-1 text-[15px] leading-5 text-[var(--x-accent)] hover:underline active:opacity-80";

const MemoContent = (props: MemoContentProps) => {
  const { className, contentClassName, content, onClick, onDoubleClick } = props;
  const t = useTranslate();
  const {
    containerRef: memoContentContainerRef,
    mode: showCompactMode,
    toggle: toggleCompactMode,
  } = useCompactMode(Boolean(props.compact), content);
  const mentionUsernames = useMemo(() => extractMentionUsernames(content), [content]);
  const resolvedMentionUsernames = useResolvedMentionUsernames(mentionUsernames);

  const compactLabel = useCompactLabel(showCompactMode, t as (key: string) => string);
  const isCollapsed = showCompactMode === "ALL";

  return (
    <div className={cn("flex w-full flex-col items-start justify-start text-foreground", className)}>
      <div
        ref={memoContentContainerRef}
        data-memo-content
        className={cn(
          "relative w-full max-w-full wrap-break-word text-[15px] leading-5",
          "[&>*:last-child]:mb-0",
          "[&_.katex-display]:max-w-full",
          "[&_.katex-display]:overflow-x-auto",
          "[&_.katex-display]:overflow-y-hidden",
          isCollapsed && "overflow-hidden",
          contentClassName,
        )}
        style={isCollapsed ? { maxHeight: `${getPreviewMaxHeightPx()}px` } : undefined}
        onMouseUp={onClick}
        onDoubleClick={onDoubleClick}
      >
        <MemoMarkdownRenderer content={content} resolvedMentionUsernames={resolvedMentionUsernames} />
        {isCollapsed && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0",
              COMPACT_MODE_CONFIG.gradientHeight,
              "bg-linear-to-t from-background from-35% via-background/70 via-70% to-transparent to-100%",
            )}
          />
        )}
      </div>
      {isCollapsed && (
        <button
          type="button"
          data-no-memo-nav
          className={showMoreButtonClass}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={toggleCompactMode}
        >
          {compactLabel}
        </button>
      )}
      {showCompactMode === "SNIPPET" && (
        <button
          type="button"
          data-no-memo-nav
          className={cn(showMoreButtonClass, "mt-0.5")}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={toggleCompactMode}
        >
          {compactLabel}
        </button>
      )}
    </div>
  );
};

export default memo(MemoContent);
