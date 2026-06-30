import { AttachmentListView, LocationDisplayView } from "@/components/MemoMetadata";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import MemoContent from "../../MemoContent";
import { MemoReactionListView } from "../../MemoReactionListView";
import { useMemoHandlers } from "../hooks";
import { useMemoViewContext } from "../MemoViewContext";
import type { MemoBodyProps } from "../types";
import QuotedMemoList from "./QuotedMemoList";

const BlurOverlay: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const t = useTranslate();
  return (
    <div className="absolute inset-0 z-10 pt-4 flex items-center justify-center" onClick={onClick}>
      <div className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-accent hover:text-foreground">
        {t("memo.click-to-show-sensitive-content")}
      </div>
    </div>
  );
};

const MemoBody: React.FC<MemoBodyProps> = ({ compact, showReactions = true }) => {
  const { memo, parentPage, showBlurredContent, blurred, readonly, openEditor, openPreview, suppressCardNavigation, toggleBlurVisibility } =
    useMemoViewContext();

  const { handleMemoContentClick, handleMemoContentDoubleClick } = useMemoHandlers({
    readonly,
    openEditor,
    openPreview,
    suppressCardNavigation,
  });

  return (
    <>
      <div
        className={cn(
          "w-full flex flex-col justify-start items-start gap-2",
          blurred && !showBlurredContent && "blur-lg transition-all duration-200",
        )}
      >
        <MemoContent
          key={memo.name}
          content={memo.content}
          onClick={handleMemoContentClick}
          onDoubleClick={handleMemoContentDoubleClick}
          compact={memo.pinned ? false : compact} // Always show full content when pinned
        />
        <AttachmentListView attachments={memo.attachments} onImagePreview={openPreview} />
        <QuotedMemoList relations={memo.relations} currentMemoName={memo.name} parentPage={parentPage} />
        {memo.location && <LocationDisplayView location={memo.location} />}
        {showReactions && <MemoReactionListView memo={memo} reactions={memo.reactions} />}
      </div>

      {blurred && !showBlurredContent && <BlurOverlay onClick={toggleBlurVisibility} />}
    </>
  );
};

export default MemoBody;
