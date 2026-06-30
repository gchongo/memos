import { timestampDate } from "@bufbuild/protobuf/wkt";
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react";
import { lazy, Suspense, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import i18n from "@/i18n";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useView } from "@/contexts/ViewContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import { useFollowedUsers } from "@/hooks/useFollowedUsers";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useUser, useUserStats } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { State } from "@/types/proto/api/v1/common_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

type TabView = "memos" | "media" | "map";

const UserMemoMap = lazy(() => import("@/components/UserMemoMap"));

const PROFILE_COVER_HEIGHT = 200;
const PROFILE_AVATAR_SIZE = 134;

const hashUsername = (username: string) => {
  let hash = 0;
  for (const char of username) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const formatJoinedLabel = (date: Date, locale: string) => {
  if (locale.startsWith("zh")) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }
  return date.toLocaleDateString(locale, { year: "numeric", month: "long" });
};

interface ProfileTabsProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  className?: string;
}

const ProfileTabs = ({ activeTab, onTabChange, className }: ProfileTabsProps) => {
  const t = useTranslate();

  const tabs: { id: TabView; label: string }[] = [
    { id: "memos", label: t("layout.profile-tab-posts") },
    { id: "media", label: t("common.media") },
    { id: "map", label: t("common.map") },
  ];

  return (
    <nav className={cn("flex border-b border-border", className)}>
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

interface ProfileHeroProps {
  user: User;
  isOwnProfile: boolean;
  followingCount: number;
  memoCount: number;
}

const ProfileHero = ({ user, isOwnProfile, followingCount, memoCount }: ProfileHeroProps) => {
  const t = useTranslate();
  const { isFollowing, toggleFollow } = useFollowedUsers();
  const displayName = user.displayName || user.username;
  const following = isFollowing(user.username);
  const coverStyle = useMemo(() => {
    const hue = hashUsername(user.username) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue} 22% 28%) 0%, hsl(${(hue + 48) % 360} 18% 14%) 100%)`,
    };
  }, [user.username]);

  const joinedLabel = user.createTime
    ? t("layout.profile-joined", { date: formatJoinedLabel(timestampDate(user.createTime), i18n.language) })
    : undefined;

  return (
    <>
      <div className="relative w-full" style={{ height: PROFILE_COVER_HEIGHT }}>
        <div className="h-full w-full bg-muted" style={coverStyle} />
      </div>

      <div className="relative px-4 pb-3">
        <div className="-mt-[calc(var(--profile-avatar-size)/2+3px)] mb-3 flex items-end justify-between gap-3">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            className="h-[var(--profile-avatar-size)] w-[var(--profile-avatar-size)] shrink-0 rounded-full border-4 border-background bg-background shadow-sm"
          />

          <div className="flex shrink-0 items-center gap-2 pb-1">
            {isOwnProfile ? (
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-full border-border px-4 text-[14px] font-bold hover:bg-accent"
              >
                <Link to={ROUTES.SETTING}>{t("layout.edit-profile")}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant={following ? "outline" : "default"}
                className={cn(
                  "h-9 rounded-full px-4 text-[14px] font-bold",
                  following
                    ? "border-border bg-transparent text-foreground hover:bg-accent"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
                onClick={() => toggleFollow(user.username)}
              >
                {following ? t("layout.following") : t("layout.follow")}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-extrabold leading-6 text-foreground">{displayName}</h2>
            <p className="text-[15px] leading-5 text-muted-foreground">@{user.username}</p>
          </div>

          {user.description && <p className="whitespace-pre-wrap text-[15px] leading-5 text-foreground">{user.description}</p>}

          {joinedLabel && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4 shrink-0" />
                {joinedLabel}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px]">
            {isOwnProfile && followingCount > 0 && (
              <Link to={ROUTES.USERS} className="transition-opacity hover:opacity-80">
                <span className="font-bold text-foreground">{followingCount}</span>{" "}
                <span className="text-muted-foreground">{t("layout.following")}</span>
              </Link>
            )}
            {memoCount > 0 && (
              <span>
                <span className="font-bold text-foreground">{memoCount}</span>{" "}
                <span className="text-muted-foreground">{t("layout.profile-tab-posts")}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const UserProfile = () => {
  const t = useTranslate();
  const username = useParams().username;
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("view") === "map" ? "map" : searchParams.get("view") === "media" ? "media" : "memos") as TabView;
  const { compactMode } = useView();
  const { followedUsernames } = useFollowedUsers();

  const { data: user, isLoading, error } = useUser(`users/${username}`, { enabled: !!username });
  const { data: userStats } = useUserStats(user?.name);

  if (error && !isLoading) {
    toast.error(t("message.user-not-found"));
  }

  const isOwnProfile = Boolean(currentUser && user && currentUser.name === user.name);
  const memoCount = userStats?.totalMemoCount ?? 0;
  const displayName = user?.displayName || user?.username || "";

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

  const mediaListSort = useCallback(
    (memos: Memo[]) => listSort(memos).filter((memo) => memo.attachments.length > 0),
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

  if (isLoading) return null;

  return (
    <section
      className="flex min-h-full w-full flex-col bg-background text-foreground"
      style={{ "--profile-avatar-size": `${PROFILE_AVATAR_SIZE}px` } as React.CSSProperties}
    >
      {user ? (
        <>
          <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
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
            followingCount={followedUsernames.length}
            memoCount={memoCount}
          />

          <ProfileTabs
            activeTab={activeTab}
            onTabChange={toggleTab}
            className="sticky top-[53px] z-10 bg-background/80 backdrop-blur-md"
          />

          <div className="flex-1">
            {activeTab === "memos" && (
              <PagedMemoList
                renderer={(memo: Memo) => (
                  <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showVisibility showPinned compact={compactMode} />
                )}
                listSort={listSort}
                orderBy={orderBy}
                filter={memoFilter}
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
