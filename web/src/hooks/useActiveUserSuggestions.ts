import { useMemo } from "react";
import { useDiscoverableUsers } from "@/hooks/useDiscoverableUsers";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { User } from "@/types/proto/api/v1/user_service_pb";

export interface ActiveUserSuggestion {
  user: User;
  memoCount: number;
}

export function useActiveUserSuggestions(limit = 3, options?: { enabled?: boolean }) {
  const currentUser = useCurrentUser();
  const enabled = (options?.enabled ?? true) && !!currentUser;

  const { users, activityByUserName, isLoading } = useDiscoverableUsers({
    enabled,
    excludeCurrentUser: true,
  });

  const suggestions = useMemo((): ActiveUserSuggestion[] => {
    return users.slice(0, limit).map((user) => ({
      user,
      memoCount: activityByUserName.get(user.name) ?? 0,
    }));
  }, [activityByUserName, limit, users]);

  return {
    suggestions,
    isLoading,
  };
}
