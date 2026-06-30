import { MoreHorizontalIcon } from "lucide-react";
import { useMemo } from "react";
import { EXPLORE_SIDEBAR_WIDTH } from "@/components/ExploreTrendsWidget";
import TagTree from "@/components/TagTree";
import XWidgetCard from "@/components/XWidgetCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { type MemoFilter, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useLocalStorage } from "@/hooks";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";

interface TagsCloudWidgetProps {
  tagCount: Record<string, number>;
  readonly?: boolean;
}

const TagsCloudWidget = ({ tagCount, readonly = false }: TagsCloudWidgetProps) => {
  const t = useTranslate();
  const { getFiltersByFactor, addFilter, removeFilter } = useMemoFilterContext();
  const [treeMode, setTreeMode] = useLocalStorage<boolean>("tag-view-as-tree", false);
  const [treeAutoExpand, setTreeAutoExpand] = useLocalStorage<boolean>("tag-tree-auto-expand", false);

  const tags = useMemo(
    () =>
      Object.entries(tagCount)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .sort((a, b) => b[1] - a[1]),
    [tagCount],
  );

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

  if (readonly && tags.length === 0) {
    return null;
  }

  const headerAction =
    tags.length > 0 ? (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={t("common.more")}
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" alignOffset={-8} className="w-auto p-2">
          <div className="flex flex-row items-center justify-between gap-4 p-1">
            <span className="shrink-0 text-sm">{t("common.tree-mode")}</span>
            <Switch checked={treeMode} onCheckedChange={(checked) => setTreeMode(checked)} />
          </div>
          <div className="flex flex-row items-center justify-between gap-4 p-1">
            <span className="shrink-0 text-sm">{t("common.auto-expand")}</span>
            <Switch disabled={!treeMode} checked={treeAutoExpand} onCheckedChange={(checked) => setTreeAutoExpand(checked)} />
          </div>
        </PopoverContent>
      </Popover>
    ) : undefined;

  return (
    <XWidgetCard
      title={t("common.tags")}
      action={headerAction}
      className="box-border w-full max-w-full shrink-0 overflow-hidden py-0"
      style={{ width: EXPLORE_SIDEBAR_WIDTH }}
    >
      <div className="-mx-2 -mt-1 min-w-0 overflow-hidden px-2">
        {tags.length === 0 ? (
          <p className="py-2 text-[15px] leading-snug text-muted-foreground">{t("tag.create-tags-guide")}</p>
        ) : treeMode ? (
          <TagTree tagAmounts={tags} expandSubTags={!!treeAutoExpand} />
        ) : (
          <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2 py-1">
            {tags.map(([tag, amount]) => {
              const isActive = getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    "inline-flex max-w-full items-baseline text-left text-[15px] leading-5 transition-opacity hover:opacity-80",
                    isActive ? "font-bold text-[var(--x-accent)]" : "text-muted-foreground",
                  )}
                >
                  <span className="truncate">#{tag}</span>
                  {amount > 1 && <span className="ml-0.5 shrink-0 opacity-60">({amount})</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </XWidgetCard>
  );
};

export default TagsCloudWidget;
