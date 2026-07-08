import { useView } from "@/contexts/ViewContext";

/** Whether timeline memos should collapse long content (X-style). */
export function useTimelineCompact(): boolean {
  const { compactMode } = useView();
  return compactMode;
}
