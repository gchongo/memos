import { useEffect, useState } from "react";
import FeedHeader, { type FeedTab } from "@/components/FeedHeader";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useInstance } from "@/contexts/InstanceContext";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { ROUTES } from "@/router/routes";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo } from "@/types/proto/api/v1/memo_service_pb";

const Home = () => {
  const user = useCurrentUser();
  const { isInitialized } = useInstance();
  const { compactMode } = useView();
  const { removeFilter } = useMemoFilterContext();
  const [feedTab, setFeedTab] = useState<FeedTab>("latest");

  // Bookmarks tab applies pinned via useMemoFilters.pinnedOnly — clear legacy context chips.
  useEffect(() => {
    removeFilter((filter) => filter.factor === "pinned");
  }, [feedTab, removeFilter]);

  const isBookmarksTab = feedTab === "pinned";

  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeShortcuts: !isBookmarksTab,
    includePinned: false,
    pinnedOnly: isBookmarksTab,
  });

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: false,
    state: State.NORMAL,
  });

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader activeTab={feedTab} onTabChange={setFeedTab} />
      <PagedMemoList
          renderer={(memo: Memo) => (
            <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
          )}
          listSort={listSort}
          orderBy={orderBy}
          filter={memoFilter}
          enabled={isInitialized}
          showMemoEditor
          scrollRestorationPath={ROUTES.HOME}
      />
    </div>
  );
};

export default Home;
