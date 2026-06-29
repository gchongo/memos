import {
  BarChart2Icon,
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Repeat2Icon,
  ShareIcon,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useInstance } from "@/contexts/InstanceContext";
import { useUpdateMemo } from "@/hooks/useMemoQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { MemoRelation_Type } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { useReactionActions } from "../../MemoReactionListView/hooks";
import { computeCommentAmount, useMemoViewContext } from "../MemoViewContext";

const formatCount = (count: number): string => {
  if (count <= 0) {
    return "";
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return String(count);
};

interface ActionButtonProps {
  label: string;
  count?: number;
  active?: boolean;
  activeClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const ActionButton = ({ label, count, active, activeClassName, onClick, children }: ActionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={cn(
      "group/action flex min-w-[36px] max-w-[80px] items-center gap-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-[var(--x-accent)]/10 hover:text-[var(--x-accent)]",
      active && activeClassName,
    )}
  >
    {children}
    {count !== undefined && count > 0 && (
      <span className={cn("text-[13px] leading-none", active && "text-[var(--x-accent)]")}>{formatCount(count)}</span>
    )}
  </button>
);

const MemoActionBar = () => {
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const { memo } = useMemoViewContext();
  const { memoRelatedSetting } = useInstance();
  const { mutateAsync: updateMemo } = useUpdateMemo();

  const commentCount = computeCommentAmount(memo);
  const likeCount = memo.reactions.length;
  const repostCount = memo.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE).length;
  const viewCount = memo.attachments.length > 0 ? memo.attachments.length : 0;

  const defaultReaction = useMemo(() => {
    const reactions = memoRelatedSetting.reactions;
    return reactions.find((reaction) => reaction.includes("❤") || reaction.includes("👍")) ?? reactions[0] ?? "👍";
  }, [memoRelatedSetting.reactions]);

  const { hasReacted, handleReactionClick } = useReactionActions({ memo });
  const liked = hasReacted(defaultReaction);
  const isArchived = memo.state === State.ARCHIVED;
  const isOwner = memo.creator === currentUser?.name;

  const handleComment = useCallback(() => {
    navigateTo(`/${memo.name}#comments`);
  }, [memo.name, navigateTo]);

  const handleLike = useCallback(() => {
    if (!currentUser || isArchived) {
      return;
    }
    void handleReactionClick(defaultReaction);
  }, [currentUser, defaultReaction, handleReactionClick, isArchived]);

  const handleBookmark = useCallback(async () => {
    if (!isOwner || isArchived) {
      return;
    }
    try {
      await updateMemo({
        update: { name: memo.name, pinned: !memo.pinned },
        updateMask: ["pinned"],
      });
    } catch {
      toast.error(t("message.failed-to-embed-memo"));
    }
  }, [isArchived, isOwner, memo.name, memo.pinned, t, updateMemo]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/${memo.name}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("message.succeed-copy-link"));
    } catch {
      toast.error(t("message.failed-to-embed-memo"));
    }
  }, [memo.name, t]);

  if (isArchived) {
    return null;
  }

  return (
    <div className="mt-1 flex w-full max-w-[425px] items-center justify-between text-muted-foreground">
      <ActionButton label={t("layout.action-comment")} count={commentCount} onClick={handleComment}>
        <MessageCircleIcon className="h-[18px] w-[18px]" />
      </ActionButton>

      <ActionButton label={t("layout.action-repost")} count={repostCount}>
        <Repeat2Icon className="h-[18px] w-[18px]" />
      </ActionButton>

      <ActionButton
        label={t("layout.action-like")}
        count={likeCount}
        active={liked}
        activeClassName="text-[#f91880] hover:text-[#f91880] hover:bg-[#f91880]/10"
        onClick={handleLike}
      >
        <HeartIcon className={cn("h-[18px] w-[18px]", liked && "fill-current")} />
      </ActionButton>

      <ActionButton label={t("layout.action-views")} count={viewCount > 0 ? viewCount : undefined}>
        <BarChart2Icon className="h-[18px] w-[18px]" />
      </ActionButton>

      {isOwner && (
        <ActionButton
          label={t("layout.action-bookmark")}
          active={memo.pinned}
          activeClassName="text-[var(--x-accent)] hover:text-[var(--x-accent)]"
          onClick={() => void handleBookmark()}
        >
          <BookmarkIcon className={cn("h-[18px] w-[18px]", memo.pinned && "fill-current")} />
        </ActionButton>
      )}

      <ActionButton label={t("layout.action-share")} onClick={() => void handleShare()}>
        <ShareIcon className="h-[18px] w-[18px]" />
      </ActionButton>
    </div>
  );
};

export default MemoActionBar;
