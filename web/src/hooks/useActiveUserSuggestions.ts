import { useMemo } from "react";
import { useMemoFilters } from "@/hooks/useMemoFilters";
import { useMemos } from "@/hooks/useMemoQueries";
import { useListUsers, useUsersByNames } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import type { User } from "@/types/proto/api/v1/user_service_pb";

export interface ActiveUserSuggestion {
  user: User;
  memoCount: number;
}

export function useActiveUserSuggestions(limit = 3, options?: { enabled?: boolean }) {
  const currentUser = useCurrentUser();
  const enabled = (options?.enabled ?? true) && !!currentUser;

  const filter = useMemoFilters({
    includeShortcuts: false,
    includePinned: false,
    ignoreContextFilters: true,
  });

  const { data, isLoading: memosLoading } = useMemos({
    state: State.NORMAL,
    orderBy: "display_time desc",
    filter,
    pageSize: 100,
  });

  const rankedCreators = useMemo(() => {
    const counts = new Map<string, number>();

    for (const memo of data?.memos ?? []) {
      if (!memo.creator || memo.creator === currentUser?.name) {
        continue;
      }
      counts.set(memo.creator, (counts.get(memo.creator) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }, [currentUser?.name, data?.memos, limit]);

  const creatorNames = useMemo(() => rankedCreators.map(([name]) => name), [rankedCreators]);
  const { data: userMap, isLoading: usersLoading } = useUsersByNames(creatorNames);

  const needsUserListFallback = enabled && !memosLoading && rankedCreators.length < limit;
  const { data: allUsers = [], isLoading: listUsersLoading } = useListUsers({
    enabled: needsUserListFallback,
  });

  const suggestions = useMemo(() => {
    const result: ActiveUserSuggestion[] = [];
    const seen = new Set<string>();

    for (const [creatorName, memoCount] of rankedCreators) {
      const user = userMap?.get(creatorName);
      if (!user?.username) {
        continue;
      }
      seen.add(user.name);
      result.push({ user, memoCount });
    }

    if (result.length >= limit) {
      return result;
    }

    for (const user of allUsers) {
      if (result.length >= limit) {
        break;
      }
      if (!user.username || user.name === currentUser?.name || seen.has(user.name)) {
        continue;
      }
      seen.add(user.name);
      result.push({ user, memoCount: 0 });
    }

    return result;
  }, [allUsers, currentUser?.name, limit, rankedCreators, userMap]);

  return {
    suggestions,
    isLoading: enabled && (memosLoading || usersLoading || (needsUserListFallback && listUsersLoading)),
  };
}
