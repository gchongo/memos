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

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeCompose()}>
      <DialogContent
        size="2xl"
        showCloseButton={false}
        overlayClassName="bg-black/10"
        className="top-[5%] max-h-[85vh] w-[calc(100%-2rem)] max-w-[600px] translate-y-0 gap-0 rounded-2xl border-border bg-background p-0"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{quoteTarget ? t("layout.repost-placeholder") : t("layout.post")}</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-accent"
            onClick={closeCompose}
            aria-label={t("common.close")}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3 px-4 py-3">
          <UserAvatar className="mt-1 shrink-0" avatarUrl={currentUser.avatarUrl} />
          <div className="min-w-0 flex-1">
            {quoteTarget && (
              <QuotedMemoCard
                className="mb-3"
                memoName={quoteTarget.name}
                fallbackSnippet={quoteTarget.snippet}
                fallbackContent={quoteTarget.content}
              />
            )}
            <MemoEditor
              key={quoteTarget?.name ?? "compose-new"}
              variant="feed"
              cacheKey={quoteTarget ? `compose-quote-${quoteTarget.name}` : "compose-dialog"}
              placeholder={quoteTarget ? t("layout.repost-placeholder") : t("layout.post-placeholder")}
              defaultRelations={defaultRelations}
              autoFocus
              onConfirm={() => closeCompose()}
              onCancel={closeCompose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostComposeDialog;
