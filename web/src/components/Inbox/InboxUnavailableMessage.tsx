import { timestampDate } from "@bufbuild/protobuf/wkt";
import type { LucideIcon } from "lucide-react";
import { TrashIcon } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import type { UserNotification } from "@/types/proto/api/v1/user_service_pb";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import { useInboxNotificationActions } from "./useInboxNotificationActions";

interface InboxUnavailableMessageProps {
  notification: UserNotification;
  icon: LucideIcon;
  summary: string;
}

const InboxUnavailableMessage = ({ notification, icon: Icon, summary }: InboxUnavailableMessageProps) => {
  const t = useTranslate();
  const sender = notification.senderUser;
  const { handleDeleteMessage } = useInboxNotificationActions(notification);
  const isUnread = notification.status === UserNotification_Status.UNREAD;

  return (
    <div
      className={cn(
        "group relative w-full border-b border-border/60 px-5 py-4 last:border-b-0 transition-colors",
        isUnread ? "bg-primary/[0.03]" : "bg-muted/10",
      )}
    >
      {isUnread && <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-gradient-to-b from-primary to-primary/60" />}

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <UserAvatar className="h-10 w-10 ring-1 ring-border/40" avatarUrl={sender?.avatarUrl} />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted/80 text-muted-foreground shadow-md">
            <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-wrap items-center gap-1.5">
              {sender && (
                <span className="text-sm font-semibold text-foreground/95">{sender.displayName || sender.username}</span>
              )}
              <span className="text-sm text-muted-foreground/80">{summary}</span>
              {notification.createTime && (
                <span className="text-xs text-muted-foreground/60">
                  {timestampDate(notification.createTime)?.toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                  {timestampDate(notification.createTime)?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDeleteMessage}
              className="rounded-lg p-1.5 opacity-0 transition-all duration-150 hover:bg-destructive/10 group-hover:opacity-100"
              title={t("common.delete")}
            >
              <TrashIcon className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" strokeWidth={2} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{t("inbox.content-unavailable")}</p>
        </div>
      </div>
    </div>
  );
};

export default InboxUnavailableMessage;
