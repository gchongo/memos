import FeedHeader from "@/components/FeedHeader";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

const Explore = () => {
  const currentUser = useCurrentUser();
  const { compactMode } = useView();
  const t = useTranslate();

  // Determine visibility filter based on authentication status
  // - Logged-in users: Can see PUBLIC and PROTECTED memos
  // - Visitors: Can only see PUBLIC memos
  // Note: The backend is responsible for filtering stats based on visibility permissions.
  const visibilities = currentUser ? [Visibility.PUBLIC, Visibility.PROTECTED] : [Visibility.PUBLIC];

  // Build filter using unified hook (no creator scoping for Explore)
  const memoFilter = useMemoFilters({
    includeShortcuts: false,
    includePinned: false,
    visibilities,
  });

  // Get sorting logic using unified hook (featured memos first on Explore)
  const { listSort, orderBy } = useMemoSorting({
    featuredFirst: true,
    state: State.NORMAL,
  });

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader title={t("common.explore")} />
      <PagedMemoList
      renderer={(memo: Memo) => (
        <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showCreator showVisibility showFeatured compact={compactMode} />
      )}
      listSort={listSort}
      orderBy={orderBy}
      filter={memoFilter}
      showCreator
      />
    </div>
  );
};

export default Explore;
