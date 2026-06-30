import { useMemo } from "react";
import { userNameFromStatsResourceName } from "@/helpers/resource-names";
import { useAllUserStats, useListUsers, useUsersByNames } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import type { UserStats } from "@/types/proto/api/v1/user_service_pb";
import { User_Role } from "@/types/proto/api/v1/user_service_pb";

const EXPLORE_VISIBILITY_FILTER = (hasUser: boolean) =>
  hasUser ? 'visibility in ["PUBLIC", "PROTECTED"]' : 'visibility in ["PUBLIC"]';

export function getUserActivityScore(stats: UserStats): number {
  return stats.memoCreatedTimestamps?.length ?? 0;
}

/** Users discoverable via public/protected memos; admins can list all registered users. */
export function useDiscoverableUsers(options?: { enabled?: boolean; excludeCurrentUser?: boolean }) {
  const currentUser = useCurrentUser();
  const enabled = options?.enabled ?? true;
  const excludeCurrentUser = options?.excludeCurrentUser ?? true;
  const isAdmin = currentUser?.role === User_Role.ADMIN;

  const { data: adminUsers = [], isPending: adminUsersPending } = useListUsers({
    enabled: enabled && isAdmin,
  });

  const { data: allUserStats = [], isPending: statsPending } = useAllUserStats(
    {
      state: State.NORMAL,
      filter: EXPLORE_VISIBILITY_FILTER(!!currentUser),
    },
    { enabled },
  );

  const rankedStats = useMemo(() => {
    return [...allUserStats]
      .filter((stats) => stats.name && (!excludeCurrentUser || userNameFromStatsResourceName(stats.name) !== currentUser?.name))
      .sort((a, b) => getUserActivityScore(b) - getUserActivityScore(a));
  }, [allUserStats, currentUser?.name, excludeCurrentUser]);

  const userNames = useMemo(
    () => rankedStats.map((stats) => userNameFromStatsResourceName(stats.name)),
    [rankedStats],
  );

  const { data: userMap, isLoading: usersLoading } = useUsersByNames(userNames, {
    enabled: enabled && !isAdmin,
  });

  const activityByUserName = useMemo(() => {
    const map = new Map<string, number>();
    for (const stats of rankedStats) {
      map.set(userNameFromStatsResourceName(stats.name), getUserActivityScore(stats));
    }
    return map;
  }, [rankedStats]);

  const users = useMemo(() => {
    if (isAdmin) {
      return adminUsers
        .filter((user) => user.username && (!excludeCurrentUser || user.name !== currentUser?.name))
        .sort((a, b) => {
          const activityDiff = (activityByUserName.get(b.name) ?? 0) - (activityByUserName.get(a.name) ?? 0);
          if (activityDiff !== 0) {
            return activityDiff;
          }
          return (a.displayName || a.username).localeCompare(b.displayName || b.username, undefined, { sensitivity: "base" });
        });
    }

    const result: User[] = [];
    for (const stats of rankedStats) {
      const userName = userNameFromStatsResourceName(stats.name);
      const user = userMap?.get(userName);
      if (user?.username) {
        result.push(user);
      }
    }
    return result;
  }, [activityByUserName, adminUsers, currentUser?.name, excludeCurrentUser, isAdmin, rankedStats, userMap]);

  const isLoading =
    enabled &&
    users.length === 0 &&
    (isAdmin ? adminUsersPending || statsPending : statsPending || (userNames.length > 0 && usersLoading));

  return {
    users,
    activityByUserName,
    isLoading,
  };
}
