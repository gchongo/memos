import { DownloadIcon, FileIcon, PaperclipIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import InlineFeedVideo from "@/components/InlineFeedVideo";
import MetadataSection from "@/components/MemoMetadata/MetadataSection";
import MotionPhotoPreview from "@/components/MotionPhotoPreview";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { getAttachmentUrl } from "@/utils/attachment";
import type { AttachmentVisualItem, PreviewMediaItem } from "@/utils/media-item";
import { buildAttachmentVisualItems } from "@/utils/media-item";
import AudioAttachmentItem from "./AudioAttachmentItem";
import { getAttachmentMetadata, isAudioAttachment, separateAttachments } from "./attachmentHelpers";
import {
  COVER_MEDIA_CLASS,
  FEED_VISUAL_TILE_BUTTON_CLASS,
  MEDIA_HOVER_GRADIENT_CLASS,
  MEDIA_HOVER_SURFACE_CLASS,
  NATURAL_MEDIA_CLASS,
  OVERFLOW_TILE_OVERLAY_CLASS,
  SINGLE_MOTION_VIDEO_CLASS,
  VISUAL_TILE_BUTTON_CLASS,
} from "./attachmentVisualClasses";
import { resolveVisualGalleryLayout } from "./visualGalleryLayout";

interface AttachmentListViewProps {
  attachments: Attachment[];
  onImagePreview?: (items: PreviewMediaItem[], index: number) => void;
}

type VisualItem = AttachmentVisualItem;

const AttachmentMeta = ({ attachment }: { attachment: Attachment }) => {
  const { fileTypeLabel, fileSizeLabel } = getAttachmentMetadata(attachment);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
      <span>{fileTypeLabel}</span>
      {fileSizeLabel && (
        <>
          <span className="text-muted-foreground/40">•</span>
          <span>{fileSizeLabel}</span>
        </>
      )}
    </div>
  );
};

const DocumentItem = ({ attachment }: { attachment: Attachment }) => {
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/65 px-3 py-2.5 transition-colors hover:bg-accent/20">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
          <FileIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium leading-tight text-foreground" title={attachment.filename}>
            {attachment.filename}
          </div>
          <AttachmentMeta attachment={attachment} />
        </div>
      </div>
      <DownloadIcon className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground/70" />
    </div>
  );
};

const getMotionPreviewProps = (item: VisualItem) => ({
  motionUrl: item.previewItem.kind === "motion" ? item.previewItem.motionUrl : item.sourceUrl,
  presentationTimestampUs: item.previewItem.kind === "motion" ? item.previewItem.presentationTimestampUs : undefined,
});

const VisualTile = ({
  className,
  onPreview,
  overlayLabel,
  tileClassName = VISUAL_TILE_BUTTON_CLASS,
  children,
}: PropsWithChildren<{ className?: string; onPreview?: () => void; overlayLabel?: string; tileClassName?: string }>) => {
  return (
    <div
      className={cn(tileClassName, className)}
      data-no-memo-nav
      data-memo-media-preview
      onClick={(event) => {
        event.stopPropagation();
        onPreview?.();
      }}
    >
      <div className={MEDIA_HOVER_SURFACE_CLASS}>
        {children}
        <div className={MEDIA_HOVER_GRADIENT_CLASS} aria-hidden />
      </div>
      {overlayLabel && <div className={OVERFLOW_TILE_OVERLAY_CLASS}>{overlayLabel}</div>}
    </div>
  );
};

const VideoVisualShell = ({
  className,
  tileClassName = FEED_VISUAL_TILE_BUTTON_CLASS,
  children,
}: PropsWithChildren<{ className?: string; tileClassName?: string }>) => (
  <div
    className={cn(tileClassName, className)}
    data-no-memo-nav
    data-memo-media-preview
    onClick={(event) => event.stopPropagation()}
    onPointerDown={(event) => event.stopPropagation()}
  >
    {children}
  </div>
);

const CollageVisualItem = ({
  item,
  onPreview,
  className,
  overlayLabel,
  tileClassName,
}: {
  item: VisualItem;
  onPreview?: () => void;
  className?: string;
  overlayLabel?: string;
  tileClassName?: string;
}) => {
  const motionPreviewProps = item.kind === "motion" ? getMotionPreviewProps(item) : undefined;

  if (item.kind === "video") {
    return (
      <VideoVisualShell className={cn("block h-full w-full", className)} tileClassName={tileClassName}>
        <InlineFeedVideo
          variant="collage"
          sourceUrl={item.sourceUrl}
          posterUrl={item.posterUrl}
          alt={item.filename}
          className={COVER_MEDIA_CLASS}
        />
        {overlayLabel && <div className={OVERFLOW_TILE_OVERLAY_CLASS}>{overlayLabel}</div>}
      </VideoVisualShell>
    );
  }

  return (
    <VisualTile className={cn("block h-full w-full", className)} onPreview={onPreview} overlayLabel={overlayLabel} tileClassName={tileClassName}>
      {item.kind === "motion" && motionPreviewProps ? (
        <MotionPhotoPreview
          posterUrl={item.posterUrl}
          motionUrl={motionPreviewProps.motionUrl}
          alt={item.filename}
          presentationTimestampUs={motionPreviewProps.presentationTimestampUs}
          containerClassName="h-full w-full"
          badgeClassName="left-2 top-2 px-2 py-0.5 text-[10px]"
          mediaClassName={COVER_MEDIA_CLASS}
        />
      ) : (
        <img src={item.posterUrl} alt={item.filename} className={COVER_MEDIA_CLASS} loading="lazy" decoding="async" />
      )}
    </VisualTile>
  );
};

const SingleVisualItem = ({
  item,
  onPreview,
  tileClassName,
}: {
  item: VisualItem;
  onPreview?: () => void;
  tileClassName?: string;
}) => {
  const motionPreviewProps = item.kind === "motion" ? getMotionPreviewProps(item) : undefined;

  if (item.kind === "image") {
    return (
      <VisualTile className="inline-block max-w-full" onPreview={onPreview} tileClassName={tileClassName}>
        <img src={item.posterUrl} alt={item.filename} className={NATURAL_MEDIA_CLASS} loading="lazy" decoding="async" />
      </VisualTile>
    );
  }

  if (item.kind === "motion" && motionPreviewProps) {
    return (
      <VisualTile className="inline-block max-w-full" onPreview={onPreview} tileClassName={tileClassName}>
        <MotionPhotoPreview
          posterUrl={item.posterUrl}
          motionUrl={motionPreviewProps.motionUrl}
          alt={item.filename}
          presentationTimestampUs={motionPreviewProps.presentationTimestampUs}
          containerClassName="max-w-full"
          posterClassName={cn(NATURAL_MEDIA_CLASS, "object-contain")}
          videoClassName={SINGLE_MOTION_VIDEO_CLASS}
          badgeClassName="left-2 top-2 px-2 py-0.5 text-[10px]"
        />
      </VisualTile>
    );
  }

  if (item.kind === "video") {
    return (
      <VideoVisualShell className="inline-block max-w-full" tileClassName={tileClassName}>
        <InlineFeedVideo
          variant="feed"
          sourceUrl={item.sourceUrl}
          posterUrl={item.posterUrl}
          alt={item.filename}
        />
      </VideoVisualShell>
    );
  }

  return null;
};

const VisualGallery = ({
  items,
  onPreview,
  tileClassName = FEED_VISUAL_TILE_BUTTON_CLASS,
}: {
  items: VisualItem[];
  onPreview?: (itemId: string) => void;
  tileClassName?: string;
}) => {
  const layout = resolveVisualGalleryLayout(items);

  if (!layout) {
    return null;
  }

  if (layout.mode === "single") {
    return (
      <div className="w-full">
        <SingleVisualItem
          item={layout.item}
          onPreview={layout.item.kind === "video" ? undefined : () => onPreview?.(layout.item.id)}
          tileClassName={tileClassName}
        />
      </div>
    );
  }

  return (
    <div className={layout.containerClassName}>
      {layout.cells.map(({ item, className, overlayLabel }) => (
        <CollageVisualItem
          key={item.id}
          item={item}
          className={className}
          overlayLabel={overlayLabel}
          onPreview={item.kind === "video" ? undefined : () => onPreview?.(item.id)}
          tileClassName={tileClassName}
        />
      ))}
    </div>
  );
};

const AudioList = ({ attachments, compact = false }: { attachments: Attachment[]; compact?: boolean }) => (
  <div className={cn("gap-2", compact ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
    {attachments.map((attachment) => (
      <AudioAttachmentItem
        key={attachment.name}
        filename={attachment.filename}
        sourceUrl={getAttachmentUrl(attachment)}
        mimeType={attachment.type}
        size={Number(attachment.size)}
        compact={compact}
      />
    ))}
  </div>
);

const DocsList = ({ attachments }: { attachments: Attachment[] }) => (
  <div className="flex flex-col gap-2">
    {attachments.map((attachment) => (
      <a key={attachment.name} href={getAttachmentUrl(attachment)} download title={`Download ${attachment.filename}`}>
        <DocumentItem attachment={attachment} />
      </a>
    ))}
  </div>
);

const Divider = () => <div className="border-t border-border/70 opacity-80" />;

const AttachmentListView = ({ attachments, onImagePreview }: AttachmentListViewProps) => {
  const { visual, audio, docs } = useMemo(() => separateAttachments(attachments), [attachments]);
  const visualItems = useMemo(() => buildAttachmentVisualItems(visual), [visual]);
  const previewItems = useMemo(
    () => visualItems.filter((item) => item.kind !== "video").map((item) => item.previewItem),
    [visualItems],
  );
  const hasVisual = visualItems.length > 0;
  const hasAudio = audio.length > 0;
  const hasDocs = docs.length > 0;
  const hasMedia = hasVisual || hasAudio;

  if (attachments.length === 0) {
    return null;
  }

  const handlePreview = (itemId: string) => {
    const index = previewItems.findIndex((item) => item.id === itemId);
    onImagePreview?.(previewItems, index >= 0 ? index : 0);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {hasVisual && <VisualGallery items={visualItems} onPreview={handlePreview} />}
      {hasAudio && <AudioList attachments={audio.filter(isAudioAttachment)} compact />}
      {hasMedia && hasDocs && <Divider />}
      {hasDocs && (
        <MetadataSection
          icon={PaperclipIcon}
          title="Attachments"
          count={docs.length}
          contentClassName="flex flex-col gap-2 p-2"
        >
          <DocsList attachments={docs} />
        </MetadataSection>
      )}
    </div>
  );
};

export default AttachmentListView;
