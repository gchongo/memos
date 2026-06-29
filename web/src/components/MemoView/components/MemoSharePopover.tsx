import { ShareIcon } from "lucide-react";
import { useState } from "react";
import MemoShareActions from "@/components/MemoShareActions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { useMemoViewContext } from "../MemoViewContext";

const MemoSharePopover = () => {
  const t = useTranslate();
  const { memo, openShareImage } = useMemoViewContext();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("layout.action-share")}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "group/action flex min-w-[36px] max-w-[80px] items-center justify-center gap-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-[var(--x-accent)]/10 hover:text-[var(--x-accent)] max-md:min-w-0 max-md:max-w-none max-md:flex-1",
          )}
        >
          <ShareIcon className="h-[18px] w-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" onClick={(event) => event.stopPropagation()}>
        <MemoShareActions memo={memo} onShareImageOpen={openShareImage} onAction={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default MemoSharePopover;
