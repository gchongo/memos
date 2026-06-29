import { timestampDate } from "@bufbuild/protobuf/wkt";
import { sortBy } from "lodash-es";
import { ArchiveIcon, InboxIcon } from "lucide-react";
import { useState } from "react";
import FeedHeader from "@/components/FeedHeader";
import MemoCommentMessage from "@/components/Inbox/MemoCommentMessage";
import MemoMentionMessage from "@/components/Inbox/MemoMentionMessage";
import Placeholder from "@/components/Placeholder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useUserQueries";
import { UserNotification, UserNotification_Status, UserNotification_Type } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

const Inboxes = () => {
  const t = useTranslate();
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");

  const { data: fetchedNotifications = [] } = useNotifications();

  const allNotifications = sortBy(fetchedNotifications, (notification: UserNotification) => {
    return -((notification.createTime ? timestampDate(notification.createTime) : undefined)?.getTime() || 0);
  });

  const notifications = allNotifications.filter((notification) => {
    if (filter === "unread") return notification.status === UserNotification_Status.UNREAD;
    if (filter === "archived") return notification.status === UserNotification_Status.ARCHIVED;
    return true;
  });

  const unreadCount = allNotifications.filter((n) => n.status === UserNotification_Status.UNREAD).length;
  const archivedCount = allNotifications.filter((n) => n.status === UserNotification_Status.ARCHIVED).length;

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader title={t("common.inbox")} />

      <div className="border-b border-border px-4 py-2">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)} variant="segmented">
          <TabsList>
            <TabsTrigger value="all">
              {t("common.all")} ({allNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              <InboxIcon className="h-3.5 w-auto" />
              {t("inbox.unread")} ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="archived">
              <ArchiveIcon className="h-3.5 w-auto" />
              {t("common.archived")} ({archivedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full">
        {notifications.length === 0 ? (
          <Placeholder
            variant="empty"
            message={filter === "unread" ? t("inbox.no-unread") : filter === "archived" ? t("inbox.no-archived") : t("message.no-data")}
          />
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification: UserNotification) => {
              if (notification.type === UserNotification_Type.MEMO_COMMENT) {
                return <MemoCommentMessage key={notification.name} notification={notification} />;
              }
              if (notification.type === UserNotification_Type.MEMO_MENTION) {
                return <MemoMentionMessage key={notification.name} notification={notification} />;
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inboxes;
