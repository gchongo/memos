import { useMemo } from "react";
import { useMemoFilters } from "@/hooks/useMemoFilters";
import { useMemos } from "@/hooks/useMemoQueries";
import { useUsersByNames } from "@/hooks/useUserQueries";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";

export interface ActiveUserSuggestion {
  user: User;
  memoCount: number;
}

export function useActiveUserSuggestions(limit = 3, options?: { enabled?: boolean }) {
  const currentUser = useCurrentUser();
  const enabled = (options?.enabled ?? true) && !!currentUser;

  const visibilities = currentUser ? [Visibility.PUBLIC, Visibility.PROTECTED] : [Visibility.PUBLIC];
  const filter = useMemoFilters({
    includeShortcuts: false,
    includePinned: false,
    visibilities,
    ignoreContextFilters: true,
  });

  const { data, isLoading: memosLoading } = useMemos({
    state: State.NORMAL,
    orderBy: "display_time desc",
    filter,
    pageSize: 50,
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

  const suggestions = useMemo(() => {
    const result: ActiveUserSuggestion[] = [];

    for (const [creatorName, memoCount] of rankedCreators) {
      const user = userMap?.get(creatorName);
      if (!user?.username) {
        continue;
      }
      result.push({ user, memoCount });
    }

    return result;
  }, [rankedCreators, userMap]);

  return {
    suggestions,
    isLoading: enabled && (memosLoading || usersLoading),
  };
}
