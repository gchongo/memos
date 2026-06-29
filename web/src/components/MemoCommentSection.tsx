import { LoaderCircleIcon } from "lucide-react";
import MemoView from "@/components/MemoView";
import { Button } from "@/components/ui/button";
import { extractMemoIdFromName } from "@/helpers/resource-names";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

interface Props {
  comments: Memo[];
  parentPage?: string;
  hasMoreComments?: boolean;
  isFetchingMoreComments?: boolean;
  onLoadMoreComments?: () => void;
}

const MemoCommentSection = ({ comments, parentPage, hasMoreComments, isFetchingMoreComments, onLoadMoreComments }: Props) => {
  const t = useTranslate();

  if (comments.length === 0 && !hasMoreComments) {
    return null;
  }

  return (
    <div className="w-full pb-8">
      <h2 id="comments" className="sr-only">
        {t("memo.comment.self")}
      </h2>
      {comments.map((comment) => (
        <div className="w-full" key={`${comment.name}-${comment.updateTime}`} id={extractMemoIdFromName(comment.name)}>
          <MemoView memo={comment} parentPage={parentPage} showCreator compact />
        </div>
      ))}
      {hasMoreComments && (
        <div className="mt-4 flex w-full justify-center">
          <Button variant="outline" className="rounded-full px-4" onClick={onLoadMoreComments} disabled={isFetchingMoreComments}>
            {isFetchingMoreComments && <LoaderCircleIcon className="h-4 w-4 animate-spin" />}
            {t(isFetchingMoreComments ? "resource.fetching-data" : "memo.load-more")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MemoCommentSection;
