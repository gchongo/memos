import { ChevronRightIcon, ImageIcon, LinkIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import MemoSharePanel from "@/components/MemoDetailSidebar/MemoSharePanel";
import { Button } from "@/components/ui/button";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { isSuperUser } from "@/utils/user";

export const SHARE_ACTION_ROW_CLASSES =
  "h-auto min-h-0 w-full justify-between rounded-none px-2 py-1.5 text-xs font-normal leading-tight text-muted-foreground transition-colors hover:bg-muted/40 hover:text-muted-foreground focus-visible:ring-offset-0 gap-1.5";

interface Props {
  memo: Memo;
  onShareImageOpen?: () => void;
  onAction?: () => void;
  className?: string;
}

const MemoShareActions = ({ memo, onShareImageOpen, onAction, className }: Props) => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const canManageShares = !memo.parent && (memo.creator === currentUser?.name || isSuperUser(currentUser));

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${memo.name}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("message.succeed-copy-link"));
      onAction?.();
    } catch {
      toast.error(t("message.failed-to-embed-memo"));
    }
  };

  return (
    <>
      <div className={className ?? "overflow-hidden rounded-md border border-border/50 bg-muted/20"}>
        {onShareImageOpen && (
          <Button
            variant="ghost"
            size="sm"
            className={SHARE_ACTION_ROW_CLASSES}
            onClick={() => {
              onShareImageOpen();
              onAction?.();
            }}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <ImageIcon className="size-3.5 shrink-0 text-muted-foreground/90" />
              <span className="truncate">{t("memo.share.open-image")}</span>
            </span>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/35" />
          </Button>
        )}
        {onShareImageOpen && canManageShares && <div className="border-t border-border/50" />}
        {canManageShares && (
          <Button
            variant="ghost"
            size="sm"
            className={SHARE_ACTION_ROW_CLASSES}
            onClick={() => {
              setSharePanelOpen(true);
              onAction?.();
            }}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <Share2Icon className="size-3.5 shrink-0 text-muted-foreground/90" />
              <span className="truncate">{t("memo.share.open-panel")}</span>
            </span>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/35" />
          </Button>
        )}
        {(onShareImageOpen || canManageShares) && <div className="border-t border-border/50" />}
        <Button variant="ghost" size="sm" className={SHARE_ACTION_ROW_CLASSES} onClick={() => void handleCopyLink()}>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <LinkIcon className="size-3.5 shrink-0 text-muted-foreground/90" />
            <span className="truncate">{t("memo.copy-link")}</span>
          </span>
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/35" />
        </Button>
      </div>

      {sharePanelOpen && <MemoSharePanel memoName={memo.name} open={sharePanelOpen} onClose={() => setSharePanelOpen(false)} />}
    </>
  );
};

export default MemoShareActions;
