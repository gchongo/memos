import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { memoKeys } from "@/hooks/useMemoQueries";
import { userKeys } from "@/hooks/useUserQueries";

export function useMobileNavRefresh() {
  const queryClient = useQueryClient();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const refreshHome = useCallback(() => {
    scrollToTop();
    queryClient.invalidateQueries({ queryKey: memoKeys.lists(), refetchType: "active" });
  }, [queryClient, scrollToTop]);

  const refreshExplore = useCallback(() => {
    scrollToTop();
    queryClient.invalidateQueries({ queryKey: memoKeys.lists(), refetchType: "active" });
  }, [queryClient, scrollToTop]);

  const refreshInbox = useCallback(() => {
    scrollToTop();
    queryClient.invalidateQueries({ queryKey: userKeys.notifications(), refetchType: "active" });
  }, [queryClient, scrollToTop]);

  const refreshProfile = useCallback(
    (username: string) => {
      scrollToTop();
      queryClient.invalidateQueries({ queryKey: memoKeys.lists(), refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: userKeys.userStats(username), refetchType: "active" });
    },
    [queryClient, scrollToTop],
  );

  return { refreshHome, refreshExplore, refreshInbox, refreshProfile };
}
