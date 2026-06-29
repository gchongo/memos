import { useEffect, useState } from "react";
import FeedHeader, { type FeedTab } from "@/components/FeedHeader";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useInstance } from "@/contexts/InstanceContext";
import { NewMemoProvider } from "@/contexts/NewMemoContext";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo } from "@/types/proto/api/v1/memo_service_pb";

const Home = () => {
  const user = useCurrentUser();
  const { isInitialized } = useInstance();
  const { compactMode } = useView();
  const { addFilter, removeFilter } = useMemoFilterContext();
  const [feedTab, setFeedTab] = useState<FeedTab>("latest");

  useEffect(() => {
    if (feedTab === "pinned") {
      addFilter({ factor: "pinned", value: "true" });
    } else {
      removeFilter((filter) => filter.factor === "pinned");
    }
  }, [feedTab, addFilter, removeFilter]);

  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeShortcuts: true,
    includePinned: true,
  });

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: feedTab === "latest",
    state: State.NORMAL,
  });

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader activeTab={feedTab} onTabChange={setFeedTab} />
      <NewMemoProvider>
        <PagedMemoList
          renderer={(memo: Memo) => (
            <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
          )}
          listSort={listSort}
          orderBy={orderBy}
          filter={memoFilter}
          enabled={isInitialized}
          showMemoEditor
        />
      </NewMemoProvider>
    </div>
  );
};

export default Home;
