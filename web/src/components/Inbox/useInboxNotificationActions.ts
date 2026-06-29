import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userServiceClient } from "@/connect";
import { userKeys } from "@/hooks/useUserQueries";
import { UserNotification, UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

export function useInboxNotificationActions(notification: UserNotification) {
  const t = useTranslate();
  const queryClient = useQueryClient();

  const refreshNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: userKeys.notifications() });
  };

  const handleArchiveMessage = async (silence = false) => {
    await userServiceClient.updateUserNotification({
      notification: {
        name: notification.name,
        status: UserNotification_Status.ARCHIVED,
      },
      updateMask: create(FieldMaskSchema, { paths: ["status"] }),
    });
    await refreshNotifications();
    if (!silence) {
      toast.success(t("message.archived-successfully"));
    }
  };

  const handleDeleteMessage = async () => {
    await userServiceClient.deleteUserNotification({
      name: notification.name,
    });
    await refreshNotifications();
    toast.success(t("message.deleted-successfully"));
  };

  return {
    handleArchiveMessage,
    handleDeleteMessage,
  };
}
