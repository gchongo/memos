import { Link } from "react-router-dom";
import FeedHeader from "@/components/FeedHeader";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useFollowedUsers } from "@/hooks/useFollowedUsers";
import { useListUsers } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

interface UserRowProps {
  user: User;
}

const UserRow = ({ user }: UserRowProps) => {
  const t = useTranslate();
  const { isFollowing, toggleFollow } = useFollowedUsers();
  const profilePath = `/u/${user.username}`;
  const following = isFollowing(user.username);

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-accent/30">
      <Link to={profilePath} viewTransition className="shrink-0">
        <UserAvatar avatarUrl={user.avatarUrl} className="h-12 w-12 rounded-full" />
      </Link>
      <Link to={profilePath} viewTransition className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold leading-5 text-foreground">{user.displayName || user.username}</div>
        <div className="truncate text-[15px] leading-5 text-muted-foreground">@{user.username}</div>
      </Link>
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
        onClick={() => toggleFollow(user.username)}
      >
        {following ? t("layout.following") : t("layout.follow")}
      </Button>
    </div>
  );
};

const Users = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { data: users = [], isLoading } = useListUsers();

  const visibleUsers = users.filter((user) => user.username && user.name !== currentUser?.name);

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader title={t("layout.all-users")} />
      {isLoading && (
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-accent/40" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-accent/40" />
                <div className="h-3 w-20 animate-pulse rounded bg-accent/40" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && visibleUsers.length === 0 && (
        <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">{t("layout.no-follow-suggestions")}</p>
      )}
      {visibleUsers.map((user) => (
        <UserRow key={user.name} user={user} />
      ))}
    </div>
  );
};

export default Users;
