import MemoEditor from "@/components/MemoEditor";
import UserAvatar from "@/components/UserAvatar";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { MemoEditorProps } from "@/components/MemoEditor/types";
import { useTranslate } from "@/utils/i18n";

type Props = Pick<MemoEditorProps, "cacheKey" | "defaultCreateTime">;

const FeedComposer = ({ cacheKey, defaultCreateTime }: Props) => {
  const t = useTranslate();
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return null;
  }

  return (
    <div id="memo-composer" className="flex gap-3 border-b border-border px-4 py-4">
      <UserAvatar className="mt-1 shrink-0" avatarUrl={currentUser.avatarUrl} />
      <div className="min-w-0 flex-1">
        <MemoEditor
          variant="feed"
          cacheKey={cacheKey}
          placeholder={t("layout.post-placeholder")}
          defaultCreateTime={defaultCreateTime}
        />
      </div>
    </div>
  );
};

export default FeedComposer;
