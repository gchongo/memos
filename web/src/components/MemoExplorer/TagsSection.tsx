import { MoreVerticalIcon, TagsIcon } from "lucide-react";
import TagCloudPill from "@/components/TagCloudPill";
import { Switch } from "@/components/ui/switch";
import { type MemoFilter, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useLocalStorage } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import TagTree from "../TagTree";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface Props {
  readonly?: boolean;
  tagCount: Record<string, number>;
  embedded?: boolean;
}

const TagsSection = (props: Props) => {
  const t = useTranslate();
  const { getFiltersByFactor, addFilter, removeFilter } = useMemoFilterContext();
  const [treeMode, setTreeMode] = useLocalStorage<boolean>("tag-view-as-tree", false);
  const [treeAutoExpand, setTreeAutoExpand] = useLocalStorage<boolean>("tag-tree-auto-expand", false);

  const tags = Object.entries(props.tagCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .sort((a, b) => b[1] - a[1]);

  const handleTagClick = (tag: string) => {
    const isActive = getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
    if (isActive) {
      removeFilter((f: MemoFilter) => f.factor === "tagSearch" && f.value === tag);
    } else {
      removeFilter((f: MemoFilter) => f.factor === "tagSearch");
      addFilter({
        factor: "tagSearch",
        value: tag,
      });
    }
  };

  return (
    <div className={cn("flex h-auto w-full shrink-0 flex-col flex-nowrap items-start justify-start", props.embedded ? "" : "mt-3 px-1")}>
      {!props.embedded && (
        <div className="mb-1 flex w-full flex-row items-center justify-between gap-1 text-sm leading-6 text-muted-foreground select-none">
          <span>{t("common.tags")}</span>
          {tags.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <MoreVerticalIcon className="w-4 h-auto shrink-0 text-muted-foreground cursor-pointer hover:text-foreground" />
              </PopoverTrigger>
              <PopoverContent align="end" alignOffset={-12}>
                <div className="w-auto flex flex-row justify-between items-center gap-2 p-1">
                  <span className="text-sm shrink-0">{t("common.tree-mode")}</span>
                  <Switch checked={treeMode} onCheckedChange={(checked) => setTreeMode(checked)} />
                </div>
                <div className="w-auto flex flex-row justify-between items-center gap-2 p-1">
                  <span className="text-sm shrink-0">{t("common.auto-expand")}</span>
                  <Switch disabled={!treeMode} checked={treeAutoExpand} onCheckedChange={(checked) => setTreeAutoExpand(checked)} />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
      {tags.length > 0 ? (
        treeMode ? (
          <TagTree tagAmounts={tags} expandSubTags={!!treeAutoExpand} />
        ) : (
          <div className="flex w-full flex-row flex-wrap items-center gap-2">
            {tags.map(([tag, amount]) => (
              <TagCloudPill
                key={tag}
                tag={tag}
                amount={amount}
                isActive={getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag)}
                onClick={() => handleTagClick(tag)}
              />
            ))}
          </div>
        )
      ) : (
        !props.readonly && (
          <div className="p-2 border border-dashed rounded-md flex flex-row justify-start items-start gap-2 text-muted-foreground">
            <TagsIcon className="w-5 h-5 shrink-0" />
            <p className="text-sm leading-snug italic">{t("tag.create-tags-guide")}</p>
          </div>
        )
      )}
    </div>
  );
};

export default TagsSection;
