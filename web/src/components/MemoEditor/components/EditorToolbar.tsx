import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { validationService } from "../services";
import { useEditorContext, useEditorSelector } from "../state";
import InsertMenu from "../Toolbar/InsertMenu";
import VisibilitySelector from "../Toolbar/VisibilitySelector";
import type { EditorToolbarProps } from "../types";

export const EditorToolbar: FC<EditorToolbarProps> = ({
  onSave,
  onCancel,
  memoName,
  onAudioRecorderClick,
  controllerRef,
  variant = "default",
  hideCancel = false,
}) => {
  const t = useTranslate();
  const { actions, dispatch } = useEditorContext();
  const valid = useEditorSelector((s) => validationService.canSave(s).valid);
  const isSaving = useEditorSelector((s) => s.ui.isLoading.saving);
  const isUploading = useEditorSelector((s) => s.ui.isLoading.uploading);
  const location = useEditorSelector((s) => s.metadata.location);
  const visibility = useEditorSelector((s) => s.metadata.visibility);

  const handleLocationChange = (next?: typeof location) => {
    dispatch(actions.setMetadata({ location: next }));
  };

  const handleToggleFocusMode = () => {
    dispatch(actions.toggleFocusMode());
  };

  const handleVisibilityChange = (next: typeof visibility) => {
    dispatch(actions.setMetadata({ visibility: next }));
  };

  if (variant === "feed") {
    return (
      <div className="mt-3 flex w-full items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex min-w-0 flex-1 flex-row items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <InsertMenu
            variant="feed"
            isUploading={isUploading}
            location={location}
            onLocationChange={handleLocationChange}
            onToggleFocusMode={handleToggleFocusMode}
            memoName={memoName}
            onAudioRecorderClick={onAudioRecorderClick}
            controllerRef={controllerRef}
          />
          <VisibilitySelector compact value={visibility} onChange={handleVisibilityChange} />
        </div>

        <div className="flex shrink-0 flex-row items-center gap-2">
          {onCancel && !hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="shrink-0 rounded-full px-3 py-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!valid || isSaving}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-[15px] font-bold transition-colors",
              valid && !isSaving
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "cursor-default bg-[#787880] text-foreground/50",
            )}
          >
            {isSaving ? t("editor.saving") : t("layout.post")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center justify-start gap-1">
        <InsertMenu
          isUploading={isUploading}
          location={location}
          onLocationChange={handleLocationChange}
          onToggleFocusMode={handleToggleFocusMode}
          memoName={memoName}
          onAudioRecorderClick={onAudioRecorderClick}
        />
        <VisibilitySelector value={visibility} onChange={handleVisibilityChange} />
      </div>

      <div className="flex flex-row items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
        )}

        <Button onClick={onSave} disabled={!valid || isSaving}>
          {isSaving ? t("editor.saving") : t("editor.save")}
        </Button>
      </div>
    </div>
  );
};
