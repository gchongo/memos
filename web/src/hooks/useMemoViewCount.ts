import { useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const STORAGE_KEY = "memos-memo-view-counts";

/** Persist memo view counts locally (Memos has no server-side view API). */
export function useMemoViewCount(memoName: string, engagementFloor = 1) {
  const [counts, setCounts] = useLocalStorage<Record<string, number>>(STORAGE_KEY, {});

  const recordView = useCallback(() => {
    setCounts((current) => ({
      ...current,
      [memoName]: (current[memoName] ?? 0) + 1,
    }));
  }, [memoName, setCounts]);

  useEffect(() => {
    recordView();
  }, [recordView]);

  const storedCount = counts[memoName] ?? 0;
  return Math.max(storedCount, engagementFloor);
}
