import { ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TagCloudPill from "@/components/TagCloudPill";
import { type MemoFilter, useMemoFilterContext } from "@/contexts/MemoFilterContext";

interface Tag {
  key: string;
  text: string;
  amount: number;
  subTags: Tag[];
}

interface Props {
  tagAmounts: [tag: string, amount: number][];
  expandSubTags: boolean;
}

const TagTree = ({ tagAmounts: rawTagAmounts, expandSubTags }: Props) => {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const sortedTagAmounts = Array.from(rawTagAmounts).sort();
    const root: Tag = {
      key: "",
      text: "",
      amount: 0,
      subTags: [],
    };

    for (const tagAmount of sortedTagAmounts) {
      const subtags = tagAmount[0].split("/");
      let tempObj = root;
      let tagText = "";

      for (let i = 0; i < subtags.length; i++) {
        const key = subtags[i];
        let amount: number = 0;

        if (i === 0) {
          tagText += key;
        } else {
          tagText += "/" + key;
        }
        if (sortedTagAmounts.some(([tag, amount]) => tag === tagText && amount > 1)) {
          amount = tagAmount[1];
        }

        let obj = null;

        for (const t of tempObj.subTags) {
          if (t.text === tagText) {
            obj = t;
            break;
          }
        }

        if (!obj) {
          obj = {
            key,
            text: tagText,
            amount: amount,
            subTags: [],
          };
          tempObj.subTags.push(obj);
        }

        tempObj = obj;
      }
    }

    setTags(root.subTags as Tag[]);
  }, [rawTagAmounts]);

  return (
    <div className="relative mt-1 flex h-auto w-full flex-col flex-nowrap items-start justify-start gap-2">
      {tags.map((t, idx) => (
        <TagItemContainer key={t.text + "-" + idx} tag={t} expandSubTags={expandSubTags} />
      ))}
    </div>
  );
};

interface TagItemContainerProps {
  tag: Tag;
  expandSubTags: boolean;
}

const TagItemContainer = (props: TagItemContainerProps) => {
  const { tag, expandSubTags } = props;
  const { getFiltersByFactor, addFilter, removeFilter } = useMemoFilterContext();
  const tagFilters = getFiltersByFactor("tagSearch");
  const isActive = tagFilters.some((f: MemoFilter) => f.value === tag.text);
  const hasSubTags = tag.subTags.length > 0;
  const [showSubTags, setShowSubTags] = useState(false);

  useEffect(() => {
    setShowSubTags(expandSubTags);
  }, [expandSubTags]);

  const handleTagClick = () => {
    if (isActive) {
      removeFilter((f: MemoFilter) => f.factor === "tagSearch" && f.value === tag.text);
    } else {
      removeFilter((f: MemoFilter) => f.factor === "tagSearch");
      addFilter({
        factor: "tagSearch",
        value: tag.text,
      });
    }
  };

  const handleToggleBtnClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowSubTags((current) => !current);
  }, []);

  return (
    <>
      <div className="relative mt-px flex w-full shrink-0 select-none flex-row items-center justify-between gap-2">
        <TagCloudPill tag={tag.text} amount={tag.amount} isActive={isActive} onClick={handleTagClick} className="min-w-0 flex-1" />
        {hasSubTags ? (
          <button
            type="button"
            aria-expanded={showSubTags}
            className={`flex h-6 w-6 shrink-0 cursor-pointer flex-row items-center justify-center transition-all ${showSubTags ? "rotate-90" : "rotate-0"}`}
            onClick={handleToggleBtnClick}
          >
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        ) : null}
      </div>
      {hasSubTags ? (
        <div
          className={`ml-2 flex h-auto w-[calc(100%-0.5rem)] flex-col items-start justify-start border-l-2 border-l-border pl-2 ${
            !showSubTags && "hidden"
          }`}
        >
          {tag.subTags.map((st, idx) => (
            <TagItemContainer key={st.text + "-" + idx} tag={st} expandSubTags={expandSubTags} />
          ))}
        </div>
      ) : null}
    </>
  );
};

export default TagTree;
