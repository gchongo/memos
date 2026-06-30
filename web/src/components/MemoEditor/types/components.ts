import type { RefObject } from "react";
import type { Location, Memo, MemoRelation, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import type { AudioRecorderStatus } from "../hooks/useAudioRecorder";
import type { EditorController } from "./editorController";

export interface MemoEditorProps {
  className?: string;
  cacheKey?: string;
  placeholder?: string;
  variant?: "default" | "feed";
  /** Full-screen mobile compose: editor grows, toolbar sticks above the keyboard. */
  composeLayout?: "default" | "fullscreen";
  /** Existing memo to edit. When provided, the editor initializes from it without fetching. */
  memo?: Memo;
  parentMemoName?: string;
  autoFocus?: boolean;
  /**
   * Default `createTime` for a *new* memo (create mode only). When set, the
   * editor seeds both `createTime` and `updateTime` to this value and renders
   * the timestamp popover so the user can adjust before saving. Tracked live:
   * if the prop changes after mount, the editor's timestamps re-sync. Ignored
   * in edit mode (when `memo` is set).
   */
  defaultCreateTime?: Date;
  /** Prefill reference relations when creating a new memo (e.g. quote repost). */
  defaultRelations?: MemoRelation[];
  onConfirm?: (memoName: string) => void;
  onCancel?: () => void;
}

export interface EditorContentProps {
  placeholder?: string;
  contentClassName?: string;
  /** Expand the editor surface to fill remaining vertical space (mobile compose). */
  fillAvailable?: boolean;
}

export interface EditorToolbarProps {
  onSave: () => void;
  onCancel?: () => void;
  memoName?: string;
  onAudioRecorderClick: () => void;
  controllerRef?: RefObject<EditorController | null>;
  variant?: "default" | "feed";
  hideCancel?: boolean;
  compact?: boolean;
}

export interface EditorMetadataProps {
  memoName?: string;
}

export interface AudioRecorderPanelProps {
  audioRecorder: { status: AudioRecorderStatus; elapsedSeconds: number };
  /** Active mic stream while recording; used for live waveform visualization. */
  mediaStream: MediaStream | null;
  onStop: () => void;
  onCancel: () => void;
  onTranscribe?: () => void;
  canTranscribe?: boolean;
  isTranscribing?: boolean;
}

export interface FocusModeOverlayProps {
  isActive: boolean;
  onToggle: () => void;
}

export interface FocusModeExitButtonProps {
  isActive: boolean;
  onToggle: () => void;
  title: string;
}

export interface InsertMenuProps {
  isUploading?: boolean;
  location?: Location;
  onLocationChange: (location?: Location) => void;
  onToggleFocusMode?: () => void;
  memoName?: string;
  onAudioRecorderClick?: () => void;
  controllerRef?: RefObject<EditorController | null>;
  variant?: "default" | "feed";
}

export interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (visibility: Visibility) => void;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
}
