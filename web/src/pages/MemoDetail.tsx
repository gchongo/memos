import { Code, ConnectError } from "@connectrpc/connect";
import { ArrowUpLeftFromCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import MemoCommentSection from "@/components/MemoCommentSection";
import { MentionResolutionProvider } from "@/components/MemoContent/MentionResolutionContext";
import MemoView from "@/components/MemoView";
import MobileBottomNav from "@/components/MobileBottomNav";
import { memoNamePrefix } from "@/helpers/resource-names";
import useMediaQuery from "@/hooks/useMediaQuery";
import useMemoDetailError from "@/hooks/useMemoDetailError";
import { useInfiniteMemoComments, useMemo } from "@/hooks/useMemoQueries";
import { useSharedMemo, withShareAttachmentLinks } from "@/hooks/useMemoShareQueries";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";

const MemoDetail = () => {
  const md = useMediaQuery("md");
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

  return (
    <div className="flex min-h-svh w-full justify-center max-md:pb-[calc(53px+env(safe-area-inset-bottom,0px))]">
      <section className="@container flex w-full max-w-[600px] min-h-full flex-col md:border-x md:border-border sm:pt-3 md:pt-6 pb-8">
        <MentionResolutionProvider contents={mentionResolutionContents}>
          <div className="w-full">
            {parentMemo && (
              <div className="mb-2 inline-block w-auto px-4">
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
              isFetchingMoreComments={isFetchingNextComments}
              onLoadMoreComments={fetchNextComments}
            />
          </div>
        </MentionResolutionProvider>
      </section>
      {!md && <MobileBottomNav />}
    </div>
  );
};

export default MemoDetail;
