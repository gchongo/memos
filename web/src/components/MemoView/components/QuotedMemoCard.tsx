import { timestampDate } from "@bufbuild/protobuf/wkt";
import { Link } from "react-router-dom";
import { MemoMarkdownRenderer } from "@/components/MemoContent/MemoMarkdownRenderer";
import { isImageAttachment, isVideoAttachment } from "@/components/MemoMetadata/Attachment/attachmentHelpers";
import UserAvatar from "@/components/UserAvatar";
import { useMemo } from "@/hooks/useMemoQueries";
import { useUser } from "@/hooks/useUserQueries";
import i18n from "@/i18n";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { getAttachmentThumbnailUrl, getAttachmentUrl } from "@/utils/attachment";

/** Collapsed quote preview height — roughly 4–5 lines, similar to X quote tweets. */
const QUOTE_PREVIEW_MAX_HEIGHT_PX = 120;

interface QuotedMemoCardProps {
  memoName: string;
  fallbackSnippet?: string;
  fallbackContent?: string;
  parentPage?: string;
  className?: string;
}

const QuotedMemoCard = ({ memoName, fallbackSnippet, fallbackContent, parentPage, className }: QuotedMemoCardProps) => {
  const { data: memo, isLoading } = useMemo(memoName, { enabled: !!memoName });
  const creator = useUser(memo?.creator ?? "").data;

  const content = memo?.content || fallbackContent || fallbackSnippet || "";
  const displayTime = memo?.createTime ? timestampDate(memo.createTime) : undefined;
  const previewAttachment = memo?.attachments.find((attachment) => isImageAttachment(attachment) || isVideoAttachment(attachment));

  return (
    <Link
      to={`/${memoName}`}
      state={{ from: parentPage }}
      viewTransition
      data-no-memo-nav
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "block w-full rounded-2xl border border-border transition-colors hover:bg-accent/30",
        className,
      )}
    >
      <div className="flex flex-col gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          {creator && <UserAvatar className="h-5 w-5 shrink-0" avatarUrl={creator.avatarUrl} />}
          <div className="min-w-0 truncate text-[15px] leading-5">
            <span className="font-bold text-foreground">{creator?.displayName || creator?.username || "…"}</span>
            {creator?.username && <span className="text-muted-foreground"> @{creator.username}</span>}
            {displayTime && (
              <>
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">
                  {displayTime.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })}
                </span>
              </>
            )}
          </div>
        </div>

        {content && (
          <div className="relative overflow-hidden text-[15px] leading-5 text-foreground" style={{ maxHeight: QUOTE_PREVIEW_MAX_HEIGHT_PX }}>
            <MemoMarkdownRenderer content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background via-background/70 to-transparent" />
          </div>
        )}

        {!content && isLoading && (
          <div className="h-10 animate-pulse rounded-lg bg-accent/40" />
        )}

        {previewAttachment && (
          <QuoteAttachmentPreview attachment={previewAttachment} />
        )}
      </div>
    </Link>
  );
};

const QuoteAttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
  const isVideo = isVideoAttachment(attachment);
  const src = isVideo ? getAttachmentUrl(attachment) : getAttachmentThumbnailUrl(attachment);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      {isVideo ? (
        <video src={src} className="max-h-[220px] w-full object-cover" muted playsInline preload="metadata" />
      ) : (
        <img src={src} alt={attachment.filename} className="max-h-[220px] w-full object-cover" loading="lazy" />
      )}
    </div>
  );
};

export default QuotedMemoCard;
