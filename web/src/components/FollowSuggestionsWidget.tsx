import { Link } from "react-router-dom";
import XWidgetCard from "@/components/XWidgetCard";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useListUsers } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

const MAX_SUGGESTIONS = 3;

interface SuggestionRowProps {
  user: User;
}

const SuggestionRow = ({ user }: SuggestionRowProps) => {
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const profilePath = `/u/${user.username}`;

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50">
      <button type="button" className="shrink-0" onClick={() => navigateTo(profilePath)}>
        <UserAvatar avatarUrl={user.avatarUrl} className="h-10 w-10 rounded-full" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigateTo(profilePath)}>
        <div className="truncate text-[15px] font-bold leading-5 text-foreground">{user.displayName || user.username}</div>
        <div className="truncate text-[15px] leading-5 text-muted-foreground">@{user.username}</div>
      </button>
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 rounded-full bg-foreground px-4 text-[14px] font-bold text-background hover:bg-foreground/90"
        onClick={() => navigateTo(profilePath)}
      >
        {t("layout.follow")}
      </Button>
    </div>
  );
};

const FollowSuggestionsWidget = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { data: users = [], isLoading } = useListUsers({ enabled: !!currentUser });

  const suggestions = users.filter((user) => user.name !== currentUser?.name && user.username).slice(0, MAX_SUGGESTIONS);

  if (!currentUser) {
    return null;
  }

  return (
    <XWidgetCard title={t("layout.who-to-follow")} className="py-0">
      <div className="-mx-2 -mt-1">
        {isLoading && (
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
        {!isLoading && suggestions.length === 0 && (
          <p className="px-2 py-2 text-[15px] text-muted-foreground">{t("message.no-data")}</p>
        )}
        {suggestions.map((user) => (
          <SuggestionRow key={user.name} user={user} />
        ))}
      </div>
      {users.length > MAX_SUGGESTIONS && (
        <Link
          to={ROUTES.EXPLORE}
          className={cn("mt-1 inline-block px-2 py-3 text-[15px] text-[var(--x-accent)] transition-opacity hover:opacity-80")}
        >
          {t("layout.show-more")}
        </Link>
      )}
    </XWidgetCard>
  );
};

export default FollowSuggestionsWidget;
