import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { GLASS_INPUT_CLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import MemoDisplaySettingMenu from "./MemoDisplaySettingMenu";

interface Props {
  className?: string;
  variant?: "default" | "x";
}

const SearchBar = ({ className, variant = "x" }: Props) => {
  const t = useTranslate();
  const { addFilter } = useMemoFilterContext();
  const [queryText, setQueryText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onTextChange = (event: React.FormEvent<HTMLInputElement>) => {
    setQueryText(event.currentTarget.value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedText = queryText.trim();
      if (trimmedText !== "") {
        const words = trimmedText.split(/\s+/);
        words.forEach((word) => {
          addFilter({
            factor: "contentSearch",
            value: word,
          });
        });
        setQueryText("");
      }
    }
  };

  return (
    <div className={cn("relative mb-4 w-full", className)}>
      <SearchIcon className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
      <input
        className={cn(
          "w-full rounded-full border border-border/60 py-3 pl-12 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-[var(--x-accent)]",
          GLASS_INPUT_CLASS,
          variant === "x" ? "pr-4" : "pr-10",
          variant === "default" && "rounded-lg border border-border bg-sidebar p-1 pl-8 text-sm leading-6",
        )}
        placeholder={t("layout.search-placeholder")}
        value={queryText}
        onChange={onTextChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
      />
      {variant === "default" && (
        <MemoDisplaySettingMenu className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  );
};

export default SearchBar;
