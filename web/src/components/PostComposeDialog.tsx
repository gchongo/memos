import { XIcon } from "lucide-react";
import MemoEditor from "@/components/MemoEditor";
import UserAvatar from "@/components/UserAvatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useTranslate } from "@/utils/i18n";

const PostComposeDialog = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { open, closeCompose } = useComposeDialog();

  if (!currentUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeCompose()}>
      <DialogContent
        size="2xl"
        showCloseButton={false}
        className="top-[5%] max-h-[85vh] w-[calc(100%-2rem)] max-w-[600px] translate-y-0 gap-0 rounded-2xl border-border bg-background p-0"
      >
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
            <MemoEditor
              variant="feed"
              cacheKey="compose-dialog"
              placeholder={t("layout.post-placeholder")}
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
