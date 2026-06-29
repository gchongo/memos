import { Code, ConnectError } from "@connectrpc/connect";
import { ArrowLeftIcon, ArrowUpLeftFromCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import MemoCommentSection from "@/components/MemoCommentSection";
import { MentionResolutionProvider } from "@/components/MemoContent/MentionResolutionContext";
import MemoView from "@/components/MemoView";
import { memoNamePrefix } from "@/helpers/resource-names";
import useMemoDetailError from "@/hooks/useMemoDetailError";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useInfiniteMemoComments, useMemo } from "@/hooks/useMemoQueries";
import { useSharedMemo, withShareAttachmentLinks } from "@/hooks/useMemoShareQueries";
import { useTranslate } from "@/utils/i18n";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";

const MemoDetail = () => {
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const params = useParams();
  const location = useLocation();
  const { state: locationState, hash } = location;

  const shareToken = params.token;
  const isShareMode = !!shareToken;

  const memoNameFromParams = params.uid ? `${memoNamePrefix}${params.uid}` : "";
  const {
    data: memoFromDirect,
    error: directError,
    isLoading: directLoading,
  } = useMemo(memoNameFromParams, { enabled: !isShareMode && !!memoNameFromParams });
  const { data: memoFromShare, error: shareError, isLoading: shareLoading } = useSharedMemo(shareToken ?? "", { enabled: isShareMode });

  const memo = isShareMode ? memoFromShare : memoFromDirect;
  const error = isShareMode ? shareError : directError;
  const isLoading = isShareMode ? shareLoading : directLoading;
  const memoName = memo?.name ?? memoNameFromParams;

  useMemoDetailError({
    error: error as Error | null,
  });

  const { data: parentMemo } = useMemo(memo?.parent || "", {
    enabled: !!memo?.parent,
  });

  const {
    data: comments = [],
    fetchNextPage: fetchNextComments,
    hasNextPage: hasNextComments,
    isFetchingNextPage: isFetchingNextComments,
  } = useInfiniteMemoComments(memoName, {
    enabled: !!memo,
  });

  useEffect(() => {
    if (!hash || comments.length === 0) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hash, comments]);

  if (isShareMode) {
    const isNotFound = error instanceof ConnectError && (error.code === Code.NotFound || error.code === Code.Unauthenticated);
    if (isNotFound || (!isLoading && !memo)) {
      return <Navigate to="/404" replace />;
    }
  }

  if (isLoading || !memo) {
    return null;
  }

  const displayMemo = isShareMode
    ? { ...memo, attachments: withShareAttachmentLinks(memo.attachments as Attachment[], shareToken!) }
    : memo;
  const mentionResolutionContents = [displayMemo.content, ...comments.map((comment) => comment.content)];
  const backTarget = typeof locationState?.from === "string" ? locationState.from : "/";

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => navigateTo(backTarget)}
          className="rounded-full p-2 transition-colors hover:bg-accent"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{t("memo.detail-title")}</h1>
      </header>

      <MentionResolutionProvider contents={mentionResolutionContents}>
        <div className="w-full">
          {parentMemo && (
            <div className="mb-2 inline-block w-auto px-4 pt-3">
              <Link
                className="flex w-auto max-w-xs flex-row flex-nowrap items-center justify-start rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground hover:opacity-80 hover:shadow"
                to={`/${parentMemo.name}`}
                state={locationState}
                viewTransition
              >
                <ArrowUpLeftFromCircleIcon className="mr-2 h-4 w-auto shrink-0 opacity-60" />
                <span className="truncate">{parentMemo.content}</span>
              </Link>
            </div>
          )}
          <MemoView
            key={`${displayMemo.name}-${displayMemo.updateTime}`}
            memo={displayMemo}
            compact={false}
            parentPage={locationState?.from}
            showCreator
            showVisibility
          />
          <MemoCommentSection
            comments={comments}
            parentPage={locationState?.from}
            hasMoreComments={hasNextComments}
            isFetchingNextComments={isFetchingNextComments}
            onLoadMoreComments={fetchNextComments}
          />
        </div>
      </MentionResolutionProvider>
    </div>
  );
};

export default MemoDetail;
