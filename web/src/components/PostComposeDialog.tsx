import { create } from "@bufbuild/protobuf";
import { XIcon } from "lucide-react";
import { useMemo } from "react";
import MemoEditor from "@/components/MemoEditor";
import QuotedMemoCard from "@/components/MemoView/components/QuotedMemoCard";
import UserAvatar from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import useMediaQuery from "@/hooks/useMediaQuery";
import { OVERLAY_SCRIM_CLASS } from "@/lib/overlay";
import { cn } from "@/lib/utils";
import {
  MemoRelation_MemoSchema,
  MemoRelation_Type,
  MemoRelationSchema,
} from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

const PostComposeDialog = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { open, quoteTarget, closeCompose } = useComposeDialog();
  const isMobile = !useMediaQuery("md");

  const defaultRelations = useMemo(() => {
    if (!quoteTarget) {
      return undefined;
    }
    return [
      create(MemoRelationSchema, {
        type: MemoRelation_Type.REFERENCE,
        relatedMemo: create(MemoRelation_MemoSchema, {
          name: quoteTarget.name,
          snippet: quoteTarget.snippet,
        }),
      }),
    ];
  }, [quoteTarget]);

  if (!currentUser) {
    return null;
  }

  const editorKey = quoteTarget?.name ?? "compose-new";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeCompose()}>
      <DialogContent
        size="2xl"
        showCloseButton={false}
        overlayClassName={cn(isMobile ? "bg-background" : OVERLAY_SCRIM_CLASS)}
        contentClassName={cn(isMobile && "h-full min-h-0 gap-0 overflow-hidden")}
        className={cn(
          "gap-0 p-0",
          isMobile
            ? "top-0 left-0 h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 shadow-none"
            : "top-[5%] max-h-[85vh] w-[calc(100%-2rem)] max-w-[600px] translate-y-0 rounded-2xl border-border",
        )}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{quoteTarget ? t("layout.repost-placeholder") : t("layout.post")}</DialogTitle>
        </VisuallyHidden>

        <div
          className={cn(
            "flex flex-col",
            isMobile && "h-full min-h-0 pt-[env(safe-area-inset-top,0px)]",
          )}
        >
          {!isMobile && (
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <button
                type="button"
                className="rounded-full p-2 transition-colors hover:bg-accent"
                onClick={closeCompose}
                aria-label={t("common.close")}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          <div
            data-compose-editor
            className={cn(
              "flex gap-3 px-4 py-3",
              isMobile && "min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            <div className={cn("flex min-w-0 flex-1 gap-3", isMobile && "min-h-0")}>
              <UserAvatar className="mt-1 shrink-0" avatarUrl={currentUser.avatarUrl} />
              <div className={cn("min-w-0 flex-1", isMobile && "flex min-h-0 flex-1 flex-col")}>
                {quoteTarget && (
                  <QuotedMemoCard
                    className="mb-3"
                    memoName={quoteTarget.name}
                    fallbackSnippet={quoteTarget.snippet}
                    fallbackContent={quoteTarget.content}
                  />
                )}
                <MemoEditor
                  key={editorKey}
                  variant="feed"
                  composeLayout={isMobile ? "fullscreen" : "default"}
                  cacheKey={quoteTarget ? `compose-quote-${quoteTarget.name}` : "compose-dialog"}
                  placeholder={quoteTarget ? t("layout.repost-placeholder") : t("layout.post-placeholder")}
                  defaultRelations={defaultRelations}
                  autoFocus
                  onConfirm={() => closeCompose()}
                  onCancel={closeCompose}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostComposeDialog;
