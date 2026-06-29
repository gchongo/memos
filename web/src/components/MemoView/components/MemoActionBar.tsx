import {
  BarChart2Icon,
  HeartIcon,
  MessageCircleIcon,
  Repeat2Icon,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import { useInstance } from "@/contexts/InstanceContext";
import { useMemoViewCount } from "@/hooks/useMemoViewCount";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { MemoRelation_Type } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { useReactionActions } from "../../MemoReactionListView/hooks";
import { computeCommentAmount, useMemoViewContext } from "../MemoViewContext";
import MemoSharePopover from "./MemoSharePopover";

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
  alwaysShowCount?: boolean;
  active?: boolean;
  activeClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const ActionButton = ({ label, count, alwaysShowCount, active, activeClassName, onClick, children }: ActionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={(event) => {
      event.stopPropagation();
      onClick?.();
    }}
    className={cn(
      "group/action flex min-w-[36px] max-w-[80px] items-center justify-center gap-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-[var(--x-accent)]/10 hover:text-[var(--x-accent)] max-md:min-w-0 max-md:max-w-none max-md:flex-1",
      active && activeClassName,
    )}
  >
    {children}
    {(alwaysShowCount || (count !== undefined && count > 0)) && count !== undefined && (
      <span className={cn("text-[13px] leading-none", active && "text-[var(--x-accent)]")}>{formatCount(count) || "1"}</span>
    )}
  </button>
);

const MemoActionBar = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { memo, openCommentEditor } = useMemoViewContext();
  const { openComposeWithQuote } = useComposeDialog();
  const { memoRelatedSetting } = useInstance();

  const commentCount = computeCommentAmount(memo);
  const likeCount = memo.reactions.length;
  const repostCount = memo.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE).length;
  const engagementFloor = Math.max(1, commentCount + likeCount);
  const viewCount = useMemoViewCount(memo.name, engagementFloor);

  const defaultReaction = useMemo(() => {
    const reactions = memoRelatedSetting.reactions;
    return reactions.find((reaction) => reaction.includes("❤") || reaction.includes("👍")) ?? reactions[0] ?? "👍";
  }, [memoRelatedSetting.reactions]);

  const { hasReacted, handleReactionClick } = useReactionActions({ memo });
  const liked = hasReacted(defaultReaction);
  const isArchived = memo.state === State.ARCHIVED;

  const handleComment = useCallback(() => {
    if (!currentUser) {
      toast.error(t("auth.protected-memo-notice"));
      return;
    }
    openCommentEditor();
  }, [currentUser, openCommentEditor, t]);

  const handleRepost = useCallback(() => {
    if (!currentUser) {
      toast.error(t("auth.protected-memo-notice"));
      return;
    }
    openComposeWithQuote(memo);
  }, [currentUser, memo, openComposeWithQuote, t]);

  const handleLike = useCallback(() => {
    if (!currentUser || isArchived) {
      return;
    }
    void handleReactionClick(defaultReaction);
  }, [currentUser, defaultReaction, handleReactionClick, isArchived]);

  if (isArchived) {
    return null;
  }

  return (
    <div className="mt-1 flex w-full items-center justify-between text-muted-foreground max-md:max-w-none md:max-w-[425px]">
      <ActionButton label={t("layout.action-comment")} count={commentCount} onClick={handleComment}>
        <MessageCircleIcon className="h-[18px] w-[18px]" />
      </ActionButton>

      <ActionButton label={t("layout.action-repost")} count={repostCount} onClick={handleRepost}>
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

      <ActionButton label={t("layout.action-views")} count={viewCount} alwaysShowCount>
        <BarChart2Icon className="h-[18px] w-[18px]" />
      </ActionButton>

      <MemoSharePopover />
    </div>
  );
};

export default MemoActionBar;
