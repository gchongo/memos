import { timestampDate } from "@bufbuild/protobuf/wkt";
import copy from "copy-to-clipboard";
import { ArrowLeftIcon } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import i18n from "@/i18n";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import ProfileHero, { profileLayoutVars } from "@/components/Profile/ProfileHero";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import { useFollowedUsers } from "@/hooks/useFollowedUsers";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useUser, useUserStats } from "@/hooks/useUserQueries";
import { GLASS_CHROME_CLASS } from "@/lib/glass";
import { MOBILE_SECONDARY_STICKY_TOP_CLASS } from "@/lib/safe-area";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { isImage } from "@/utils/attachment";
import { useTranslate } from "@/utils/i18n";

type TabView = "memos" | "replies" | "media" | "map";

const UserMemoMap = lazy(() => import("@/components/UserMemoMap"));

const formatJoinedLabel = (date: Date, locale: string) => {
  if (locale.startsWith("zh")) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }
  return date.toLocaleDateString(locale, { year: "numeric", month: "long" });
};

const isTopLevelMemo = (memo: Memo) => !memo.parent;

const isReplyMemo = (memo: Memo) => Boolean(memo.parent);

const hasMediaContent = (memo: Memo) => {
  if (memo.location?.latitude != null && memo.location?.longitude != null) {
    return true;
  }
  return memo.attachments.some((attachment) => isImage(attachment.type) || attachment.type.startsWith("video"));
};

const parseTabView = (value: string | null): TabView => {
  if (value === "map") return "map";
  if (value === "media") return "media";
  if (value === "replies") return "replies";
  return "memos";
};

interface ProfileTabsProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ProfileTabs = ({ activeTab, onTabChange, className, style }: ProfileTabsProps) => {
  const t = useTranslate();

  const tabs: { id: TabView; label: string }[] = [
    { id: "memos", label: t("layout.profile-tab-posts") },
    { id: "replies", label: t("layout.profile-tab-replies") },
    { id: "media", label: t("layout.profile-tab-media") },
    { id: "map", label: t("layout.profile-tab-map") },
  ];

  return (
    <nav className={cn("flex border-b border-border", className)} style={style}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex h-[53px] min-w-0 flex-1 items-center justify-center px-2 text-[15px] transition-colors hover:bg-accent/50",
            activeTab === tab.id ? "font-bold text-foreground" : "font-normal text-muted-foreground",
          )}
        >
          <span className="truncate">{tab.label}</span>
          {activeTab === tab.id && <span className="absolute bottom-0 h-1 w-14 rounded-full bg-[var(--x-accent)]" />}
        </button>
      ))}
    </nav>
  );
};

const UserProfile = () => {
  const t = useTranslate();
  const username = useParams().username;
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(53);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTabView(searchParams.get("view"));
  const { compactMode } = useView();
  const { isFollowing, toggleFollow } = useFollowedUsers();

  const { data: user, isLoading, error } = useUser(`users/${username}`, { enabled: !!username });
  const { data: userStats } = useUserStats(user?.name);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [user]);

  if (error && !isLoading) {
    toast.error(t("message.user-not-found"));
  }

  const isOwnProfile = Boolean(currentUser && user && currentUser.name === user.name);
  const memoCount = userStats?.totalMemoCount ?? 0;
  const displayName = user?.displayName || user?.username || "";
  const scrollRestorationPath = `${location.pathname}${location.search}`;

  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeShortcuts: false,
    includePinned: false,
    ignoreContextFilters: true,
  });

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: false,
    state: State.NORMAL,
  });

  const postsListSort = useCallback(
    (memos: Memo[]) => listSort(memos).filter(isTopLevelMemo),
    [listSort],
  );

  const repliesListSort = useCallback(
    (memos: Memo[]) => listSort(memos).filter(isReplyMemo),
    [listSort],
  );

  const mediaListSort = useCallback(
    (memos: Memo[]) => listSort(memos).filter((memo) => isTopLevelMemo(memo) && hasMediaContent(memo)),
    [listSort],
  );

  const toggleTab = (view: TabView) => {
    setSearchParams((prev) => {
      if (view === "memos") {
        prev.delete("view");
      } else {
        prev.set("view", view);
      }
      return prev;
    });
  };

  const backTarget = typeof location.state?.from === "string" ? location.state.from : "/";
  const joinedLabel = user?.createTime
    ? t("layout.profile-joined", { joinedAt: formatJoinedLabel(timestampDate(user.createTime), i18n.language) })
    : undefined;
  const followerCount = userStats?.followerCount ?? 0;
  const followingCount = userStats?.followingCount ?? 0;

  const handleShareProfile = () => {
    if (!user) return;
    copy(`${window.location.origin}/u/${encodeURIComponent(user.username)}`);
    toast.success(t("message.copied"));
  };

  const handleFollowToggle = () => {
    if (!user) return;
    toggleFollow(user.username);
  };

  const emptyMessage =
    activeTab === "media"
      ? t("layout.profile-empty-media")
      : activeTab === "replies"
        ? t("layout.profile-empty-replies")
        : undefined;

  if (isLoading) return null;

  return (
    <section
      className="flex min-h-full w-full flex-col bg-background text-foreground"
      style={{ "--profile-avatar-size": `${profileLayoutVars.avatarSize}px` } as React.CSSProperties}
    >
      {user ? (
        <>
          <header
            ref={headerRef}
            className={cn(MOBILE_SECONDARY_STICKY_TOP_CLASS, GLASS_CHROME_CLASS, "z-20 border-b border-border/50 md:top-0")}
          >
            <div className="flex items-center gap-6 px-4 py-2">
              <button
                type="button"
                aria-label={t("common.back")}
                onClick={() => navigateTo(backTarget)}
                className="-ml-2 rounded-full p-2 transition-colors hover:bg-accent"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold leading-6">{displayName}</h1>
                {memoCount > 0 && (
                  <p className="truncate text-[13px] leading-4 text-muted-foreground">
                    {t("layout.profile-post-count", { count: memoCount })}
                  </p>
                )}
              </div>
            </div>
          </header>

          <ProfileHero
            user={user}
            isOwnProfile={isOwnProfile}
            followingCount={followingCount}
            followerCount={followerCount}
            joinedLabel={joinedLabel}
            onShareProfile={handleShareProfile}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing(user.username)}
          />

          <ProfileTabs
            activeTab={activeTab}
            onTabChange={toggleTab}
            className="sticky z-10 glass-chrome"
            style={{ top: headerHeight }}
          />

          <div className="flex-1">
            {activeTab === "memos" && (
              <PagedMemoList
                renderer={(memo: Memo) => (
                  <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
                )}
                listSort={postsListSort}
                orderBy={orderBy}
                filter={memoFilter}
                scrollRestorationPath={scrollRestorationPath}
              />
            )}
            {activeTab === "replies" && (
              <PagedMemoList
                renderer={(memo: Memo) => (
                  <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
                )}
                listSort={repliesListSort}
                orderBy={orderBy}
                filter={memoFilter}
                includeComments
                scrollRestorationPath={scrollRestorationPath}
                emptyMessage={emptyMessage}
              />
            )}
            {activeTab === "media" && (
              <PagedMemoList
                renderer={(memo: Memo) => (
                  <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
                )}
                listSort={mediaListSort}
                orderBy={orderBy}
                filter={memoFilter}
                scrollRestorationPath={scrollRestorationPath}
                emptyMessage={emptyMessage}
              />
            )}
            {activeTab === "map" && (
              <Suspense fallback={<div className="mx-4 h-[60dvh] rounded-xl border border-border bg-muted/30 sm:h-[500px]" />}>
                <UserMemoMap creator={user.name} className="h-[60dvh] sm:h-[500px]" />
              </Suspense>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-muted-foreground">{t("message.user-not-found")}</p>
        </div>
      )}
    </section>
  );
};

export default UserProfile;
