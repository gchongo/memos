import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

export interface MemoViewProps {
  memo: Memo;
  compact?: boolean;
  showCreator?: boolean;
  showVisibility?: boolean;
  showPinned?: boolean;
  showFeatured?: boolean;
  /** Hide reaction picker, action menu, and X action bar (e.g. compact sidebar embed). */
  showReactions?: boolean;
  /** Hide the action menu in the header (e.g. compact sidebar embed). */
  showActions?: boolean;
  /** Show X-style comment/like/share action bar under the memo body. */
  showActionBar?: boolean;
  className?: string;
  parentPage?: string;
  shareImageDialogOpen?: boolean;
  onShareImageDialogOpenChange?: (open: boolean) => void;
}

export interface MemoHeaderProps {
  showCreator?: boolean;
  showVisibility?: boolean;
  showPinned?: boolean;
  showFeatured?: boolean;
  showReactions?: boolean;
  showActions?: boolean;
  variant?: "default" | "x";
}

export interface MemoBodyProps {
  compact?: boolean;
  showReactions?: boolean;
}
