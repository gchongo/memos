import { useMemo } from "react";
import MemoView from "@/components/MemoView";
import Placeholder from "@/components/Placeholder";
import XWidgetCard from "@/components/XWidgetCard";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import { useMemos } from "@/hooks/useMemoQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

const SIDEBAR_MEMO_COUNT = 8;

const ExploreTrendsWidget = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { compactMode } = useView();

  const visibilities = currentUser ? [Visibility.PUBLIC, Visibility.PROTECTED] : [Visibility.PUBLIC];
  const filter = useMemoFilters({
    includeShortcuts: false,
    includePinned: false,
    visibilities,
    ignoreContextFilters: true,
  });

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: false,
    state: State.NORMAL,
  });

  const { data, isLoading } = useMemos({
    state: State.NORMAL,
    orderBy,
    filter,
    pageSize: SIDEBAR_MEMO_COUNT,
  });

  const memos = useMemo(() => listSort(data?.memos ?? []), [data?.memos, listSort]);

  return (
    <XWidgetCard title={t("layout.whats-happening")} className="py-0">
      <div className="-mx-4">
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse border-b border-border bg-accent/20" />
            ))}
          </div>
        )}
        {!isLoading && memos.length === 0 && <Placeholder variant="empty" message={t("message.no-data")} />}
        {memos.map((memo) => (
          <MemoView key={memo.name} memo={memo} showCreator showVisibility compact={compactMode} parentPage="/explore" />
        ))}
      </div>
    </XWidgetCard>
  );
};

export default ExploreTrendsWidget;
