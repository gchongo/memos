import { cn } from "@/lib/utils";
import { tagStyles } from "@/lib/markdownStyles";

interface TagCloudPillProps {
  tag: string;
  amount?: number;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

/** Sidebar / tag-cloud pill — same capsule shape as inline memo tags. */
const TagCloudPill = ({ tag, amount, isActive = false, onClick, className }: TagCloudPillProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      tagStyles.base,
      "max-w-full transition-opacity hover:opacity-90",
      isActive ? tagStyles.activeColor : tagStyles.defaultColor,
      className,
    )}
  >
    <span className="truncate">#{tag}</span>
    {amount != null && amount > 1 && <span className="ml-1 shrink-0 opacity-70">({amount})</span>}
  </button>
);

export default TagCloudPill;
