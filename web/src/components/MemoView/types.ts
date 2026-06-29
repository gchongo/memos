import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

export interface MemoViewProps {
  memo: Memo;
  compact?: boolean;
  showCreator?: boolean;
  showVisibility?: boolean;
  showPinned?: boolean;
  /** Hide reaction picker and reaction list (e.g. compact sidebar embed). */
  showReactions?: boolean;
  /** Hide the action menu in the header (e.g. compact sidebar embed). */
  showActions?: boolean;
  className?: string;
  parentPage?: string;
  shareImageDialogOpen?: boolean;
  onShareImageDialogOpenChange?: (open: boolean) => void;
}

export interface MemoHeaderProps {
  showCreator?: boolean;
  showVisibility?: boolean;
  showPinned?: boolean;
  showReactions?: boolean;
  showActions?: boolean;
  variant?: "default" | "x";
}

export interface MemoBodyProps {
  compact?: boolean;
  showReactions?: boolean;
}
