import type { FC } from "react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import type { UploadProgressUpdate } from "../services/uploadProgress";

interface UploadProgressBarProps {
  progress: UploadProgressUpdate;
  className?: string;
}

export const UploadProgressBar: FC<UploadProgressBarProps> = ({ progress, className }) => {
  const t = useTranslate();
  const phaseLabel = progress.phase === "compressing" ? t("editor.upload-progress.compressing") : t("editor.upload-progress.uploading");

  return (
    <div className={cn("w-full rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5", className)}>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">
          {phaseLabel} · {progress.filename}
        </span>
        <span className="shrink-0 tabular-nums">
          {progress.fileCount > 1 ? `${progress.fileIndex}/${progress.fileCount} · ` : ""}
          {progress.percent}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
};
