import { HashIcon } from "lucide-react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTagCounts } from "@/hooks/useUserQueries";
import { useTranslate } from "@/utils/i18n";
import type { InsertMenuProps } from "../types";

interface TagPickerMenuProps {
  controllerRef?: InsertMenuProps["controllerRef"];
  triggerClassName: string;
}

const TagPickerMenu = ({ controllerRef, triggerClassName }: TagPickerMenuProps) => {
  const t = useTranslate();
  const { data: tagCount = {} } = useTagCounts(true);
  const sortedTags = useMemo(
    () =>
      Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([tag]) => tag),
    [tagCount],
  );

  const handleSelectTag = (tag: string) => {
    const editor = controllerRef?.current;
    if (!editor) {
      return;
    }
    editor.insertTag(tag);
    editor.focus();
    editor.scrollToCursor();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClassName} aria-label={t("tooltip.tags")}>
          <HashIcon className="size-[18px]" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        {sortedTags.length === 0 ? (
          <DropdownMenuItem disabled>{t("tag.no-tag-found")}</DropdownMenuItem>
        ) : (
          sortedTags.map((tag) => (
            <DropdownMenuItem key={tag} onClick={() => handleSelectTag(tag)}>
              <span className="truncate">
                <span className="mr-1 text-muted-foreground">#</span>
                {tag}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TagPickerMenu;
