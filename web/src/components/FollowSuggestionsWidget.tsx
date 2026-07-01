import { Link } from "react-router-dom";
import { EXPLORE_SIDEBAR_WIDTH } from "@/components/ExploreTrendsWidget";
import XWidgetCard from "@/components/XWidgetCard";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useActiveUserSuggestions } from "@/hooks/useActiveUserSuggestions";
import { useFollowedUsers } from "@/hooks/useFollowedUsers";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

const MAX_SUGGESTIONS = 3;

interface SuggestionRowProps {
  user: User;
  memoCount: number;
}

const SuggestionRow = ({ user, memoCount }: SuggestionRowProps) => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const navigateTo = useNavigateTo();
  const { isFollowing, toggleFollow } = useFollowedUsers();
  const profilePath = `/u/${user.username}`;
  const following = isFollowing(user.username);

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50">
      <button type="button" className="shrink-0" onClick={() => navigateTo(profilePath)}>
        <UserAvatar avatarUrl={user.avatarUrl} className="h-10 w-10 rounded-full" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigateTo(profilePath)}>
        <div className="truncate text-[15px] font-bold leading-5 text-foreground">{user.displayName || user.username}</div>
        <div className="truncate text-[15px] leading-5 text-muted-foreground">
          @{user.username}
          {memoCount > 0 && ` · ${t("layout.active-memo-count", { count: memoCount })}`}
        </div>
      </button>
      <Button
        type="button"
        size="sm"
        variant={following ? "outline" : "default"}
        className={cn(
          "h-8 shrink-0 rounded-full px-4 text-[14px] font-bold",
          following
            ? "border-border bg-transparent text-foreground hover:bg-accent"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
        onClick={() => toggleFollow(user.username, currentUser?.username)}
      >
        {following ? t("layout.following") : t("layout.follow")}
      </Button>
    </div>
  );
};

const FollowSuggestionsWidget = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { suggestions, isLoading } = useActiveUserSuggestions(MAX_SUGGESTIONS, { enabled: !!currentUser });
  const { isFollowing } = useFollowedUsers();

  const visibleSuggestions = suggestions.filter((item) => !isFollowing(item.user.username));

  if (!currentUser) {
    return null;
  }

  return (
    <XWidgetCard
      title={t("layout.who-to-follow")}
      className="box-border w-full max-w-full shrink-0 overflow-hidden bg-background py-0"
      style={{ width: EXPLORE_SIDEBAR_WIDTH }}
    >
      <div className="-mx-2 -mt-1 min-w-0 overflow-hidden">
        {isLoading && visibleSuggestions.length === 0 && suggestions.length === 0 && (
          <div className="space-y-3 px-2 py-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-accent/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-accent/40" />
                  <div className="h-3 w-16 animate-pulse rounded bg-accent/40" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && visibleSuggestions.length === 0 && (
          <p className="px-2 py-2 text-[15px] text-muted-foreground">{t("layout.no-follow-suggestions")}</p>
        )}
        {visibleSuggestions.map(({ user, memoCount }) => (
          <SuggestionRow key={user.name} user={user} memoCount={memoCount} />
        ))}
      </div>
      {!isLoading && (
        <Link
          to={ROUTES.USERS}
          className={cn("mt-1 inline-block px-2 py-3 text-[15px] text-[var(--x-accent)] transition-opacity hover:opacity-80")}
        >
          {t("layout.show-more")}
        </Link>
      )}
    </XWidgetCard>
  );
};

export default FollowSuggestionsWidget;
