import { HashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTagCounts } from "@/hooks/useUserQueries";
import { isTagChar } from "@/utils/tag-grammar";
import { useTranslate } from "@/utils/i18n";
import type { InsertMenuProps } from "../types";

interface TagPickerMenuProps {
  controllerRef?: InsertMenuProps["controllerRef"];
  triggerClassName: string;
}

const normalizeTagInput = (value: string) => value.trim().replace(/^#+/, "");

const isValidTagName = (value: string) => {
  const tag = normalizeTagInput(value);
  if (!tag) return false;
  return [...tag].every((char) => isTagChar(char));
};

const TagPickerMenu = ({ controllerRef, triggerClassName }: TagPickerMenuProps) => {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: tagCount = {} } = useTagCounts(true);
  const sortedTags = useMemo(
    () =>
      Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([tag]) => tag),
    [tagCount],
  );

  const normalizedQuery = normalizeTagInput(query);
  const filteredTags = useMemo(() => {
    if (!normalizedQuery) return sortedTags;
    const q = normalizedQuery.toLowerCase();
    return sortedTags.filter((tag) => tag.toLowerCase().includes(q));
  }, [normalizedQuery, sortedTags]);

  const canCreateTag =
    normalizedQuery.length > 0 &&
    isValidTagName(normalizedQuery) &&
    !sortedTags.some((tag) => tag.toLowerCase() === normalizedQuery.toLowerCase());

  const insertTag = (tag: string) => {
    const editor = controllerRef?.current;
    if (!editor) {
      return;
    }
    editor.insertTag(tag);
    editor.focus();
    editor.scrollToCursor();
    setQuery("");
    setOpen(false);
  };

  const handleCreateTag = () => {
    if (!canCreateTag) return;
    insertTag(normalizedQuery);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClassName} aria-label={t("tooltip.tags")}>
          <HashIcon className="size-[18px]" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              if (canCreateTag) {
                handleCreateTag();
              } else if (filteredTags[0]) {
                insertTag(filteredTags[0]);
              }
            }
          }}
          placeholder={t("tag.create-tag-placeholder")}
          className="h-8 text-sm"
        />
        {canCreateTag && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem onClick={handleCreateTag}>
              <span className="truncate">
                {t("tag.create-tag-with-name", { tag: normalizedQuery })}
              </span>
            </DropdownMenuItem>
          </>
        )}
        {filteredTags.length > 0 && (
          <>
            {(canCreateTag || normalizedQuery) && <DropdownMenuSeparator className="my-2" />}
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => insertTag(tag)}>
                  <span className="truncate">
                    <span className="mr-1 text-muted-foreground">#</span>
                    {tag}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}
        {!canCreateTag && filteredTags.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("tag.create-tags-guide")}</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TagPickerMenu;
