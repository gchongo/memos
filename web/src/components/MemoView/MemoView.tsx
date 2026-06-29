import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUser } from "@/hooks/useUserQueries";
import { findTagMetadata } from "@/lib/tag";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { isSuperUser } from "@/utils/user";
import MemoShareImageDialog from "../MemoActionMenu/MemoShareImageDialog";
import MemoEditor from "../MemoEditor";
import PreviewImageDialog from "../PreviewImageDialog";
import UserAvatar from "../UserAvatar";
import { MemoBody, MemoCommentListView, MemoHeader } from "./components";
import { MEMO_CARD_BASE_CLASSES } from "./constants";
import { useImagePreview } from "./hooks";
import { computeCommentAmount, MemoViewContext } from "./MemoViewContext";
import type { MemoViewProps } from "./types";

const MemoView: React.FC<MemoViewProps> = (props: MemoViewProps) => {
  const {
    memo: memoData,
    className,
    parentPage: parentPageProp,
    compact,
    showCreator,
    showVisibility,
    showPinned,
    showReactions = true,
    showActions = true,
  } = props;
  const cardRef = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);

  const currentUser = useCurrentUser();
  const { userTagsSetting } = useAuth();
  const creator = useUser(memoData.creator).data;
  const isArchived = memoData.state === State.ARCHIVED;
  const readonly = memoData.creator !== currentUser?.name && !isSuperUser(currentUser);
  const parentPage = parentPageProp || "/";

  // Blur content when any tag has blur_content enabled in the current user's tag settings.
  const [showBlurredContent, setShowBlurredContent] = useState(false);
  const blurred = memoData.tags?.some((tag) => userTagsSetting && findTagMetadata(tag, userTagsSetting)?.blurContent) ?? false;
  const toggleBlurVisibility = useCallback(() => setShowBlurredContent((prev) => !prev), []);

  const { previewState, openPreview, setPreviewOpen } = useImagePreview();

  const openEditor = useCallback(() => setShowEditor(true), []);
  const closeEditor = useCallback(() => setShowEditor(false), []);

  const location = useLocation();
  const isInMemoDetailPage = location.pathname.startsWith(`/${memoData.name}`) || location.pathname.startsWith("/memos/shares/");
  const showCommentPreview = !isInMemoDetailPage && computeCommentAmount(memoData) > 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }

    const updateWidth = (nextWidth?: number) => {
      const width = Math.round(nextWidth ?? card.getBoundingClientRect().width);
      setCardWidth((prev) => (prev === width ? prev : width));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => updateWidth();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      updateWidth(entries[0]?.contentRect.width);
    });

    resizeObserver.observe(card);
    return () => resizeObserver.disconnect();
  }, []);

  const contextValue = useMemo(
    () => ({
      memo: memoData,
      creator,
      currentUser,
      parentPage,
      cardWidth,
      isArchived,
      readonly,
      showBlurredContent,
      blurred,
      openEditor,
      toggleBlurVisibility,
      openPreview,
    }),
    [
      memoData,
      creator,
      currentUser,
      parentPage,
      cardWidth,
      isArchived,
      readonly,
      showBlurredContent,
      blurred,
      openEditor,
      toggleBlurVisibility,
      openPreview,
    ],
  );

  if (showEditor) {
    return (
      <MemoEditor
        autoFocus
        className="mb-2"
        cacheKey={`inline-memo-editor-${memoData.name}`}
        memo={memoData}
        parentMemoName={memoData.parent || undefined}
        onConfirm={closeEditor}
        onCancel={closeEditor}
      />
    );
  }

  const article = (
    <article
      className={cn(MEMO_CARD_BASE_CLASSES, showCommentPreview ? "border-b-0" : "", className)}
      ref={cardRef}
      tabIndex={readonly ? -1 : 0}
    >
      {(showCreator ? creator : currentUser) && (
        <Link
          className="shrink-0 rounded-full transition-opacity hover:opacity-80"
          to={`/u/${encodeURIComponent((showCreator ? creator : currentUser)?.username ?? "")}`}
          viewTransition
        >
          <UserAvatar avatarUrl={(showCreator ? creator : currentUser)?.avatarUrl} />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <MemoHeader
          showCreator={showCreator}
          showVisibility={showVisibility}
          showPinned={showPinned}
          showReactions={showReactions}
          showActions={showActions}
          variant="x"
        />

        <MemoBody compact={compact} showReactions={showReactions} />

        <PreviewImageDialog
          open={previewState.open}
          onOpenChange={setPreviewOpen}
          items={previewState.items}
          initialIndex={previewState.index}
        />

        {props.onShareImageDialogOpenChange && (
          <MemoShareImageDialog open={Boolean(props.shareImageDialogOpen)} onOpenChange={props.onShareImageDialogOpenChange} />
        )}
      </div>
    </article>
  );

  return (
    <MemoViewContext.Provider value={contextValue}>
      {showCommentPreview ? (
        <div className="w-full border-b border-border">
          {article}
          <MemoCommentListView />
        </div>
      ) : (
        article
      )}
    </MemoViewContext.Provider>
  );
};

export default memo(MemoView);
