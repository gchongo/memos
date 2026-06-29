import { useMemo } from "react";
import type { MemoRelation } from "@/types/proto/api/v1/memo_service_pb";
import { MemoRelation_Type } from "@/types/proto/api/v1/memo_service_pb";
import QuotedMemoCard from "./QuotedMemoCard";

interface QuotedMemoListProps {
  relations: MemoRelation[];
  currentMemoName: string;
  parentPage?: string;
  className?: string;
}

const QuotedMemoList = ({ relations, currentMemoName, parentPage, className }: QuotedMemoListProps) => {
  const quotedRelations = useMemo(
    () =>
      relations.filter(
        (relation) =>
          relation.type === MemoRelation_Type.REFERENCE &&
          relation.memo?.name === currentMemoName &&
          relation.relatedMemo?.name,
      ),
    [relations, currentMemoName],
  );

  if (quotedRelations.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex w-full flex-col gap-2"} data-no-memo-nav>
      {quotedRelations.map((relation) => (
        <QuotedMemoCard
          key={relation.relatedMemo!.name}
          memoName={relation.relatedMemo!.name}
          fallbackSnippet={relation.relatedMemo!.snippet}
          parentPage={parentPage}
        />
      ))}
    </div>
  );
};

export default QuotedMemoList;
