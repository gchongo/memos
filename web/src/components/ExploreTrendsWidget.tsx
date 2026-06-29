import { MoreHorizontalIcon } from "lucide-react";
import { Link } from "react-router-dom";
import XWidgetCard from "@/components/XWidgetCard";
import { useMemoFilters } from "@/hooks";
import { useMemos } from "@/hooks/useMemoQueries";
import { useUser } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { State } from "@/types/proto/api/v1/common_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

const SNIPPET_MAX = 72;

function memoSnippet(content: string): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= SNIPPET_MAX) {
    return plain || "…";
  }

  return `${plain.slice(0, SNIPPET_MAX)}…`;
}

interface TrendRowProps {
  memo: Memo;
}

const TrendRow = ({ memo }: TrendRowProps) => {
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const creator = useUser(memo.creator).data;
  const category = creator?.displayName || creator?.username || t("common.explore");

  return (
    <button
      type="button"
      onClick={() => navigateTo(`/${memo.name}`)}
      className="group flex w-full items-start justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] leading-4 text-muted-foreground">
          {t("layout.trending-in")} · {category}
        </div>
        <div className="mt-0.5 truncate text-[15px] font-bold leading-5 text-foreground">{memoSnippet(memo.content)}</div>
        {memo.tags.length > 0 && (
          <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
            #{memo.tags[0]}
            {memo.tags.length > 1 ? ` +${memo.tags.length - 1}` : ""}
          </div>
        )}
      </div>
      <MoreHorizontalIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
};

const ExploreTrendsWidget = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();

  const visibilities = currentUser ? [Visibility.PUBLIC, Visibility.PROTECTED] : [Visibility.PUBLIC];
  const filter = useMemoFilters({
    includeShortcuts: false,
    includePinned: false,
    visibilities,
  });

  const { data, isLoading } = useMemos({
    state: State.NORMAL,
    orderBy: "display_time desc",
    filter,
    pageSize: 5,
  });

  const memos = data?.memos ?? [];

  return (
    <XWidgetCard title={t("layout.whats-happening")} className="py-0">
      <div className="-mx-2 -mt-1">
        {isLoading && (
          <div className="space-y-3 px-2 py-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-accent/40" />
            ))}
          </div>
        )}
        {!isLoading && memos.length === 0 && (
          <p className="px-2 py-2 text-[15px] text-muted-foreground">{t("message.no-data")}</p>
        )}
        {memos.map((memo) => (
          <TrendRow key={memo.name} memo={memo} />
        ))}
      </div>
      <Link
        to={Routes.EXPLORE}
        className={cn(
          "mt-1 inline-block px-2 py-3 text-[15px] text-[var(--x-accent)] transition-opacity hover:opacity-80",
        )}
      >
        {t("layout.show-more")}
      </Link>
    </XWidgetCard>
  );
};

export default ExploreTrendsWidget;
