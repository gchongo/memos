import { GLASS_CHROME_CLASS } from "@/lib/glass";
import { MOBILE_SECONDARY_STICKY_TOP_CLASS } from "@/lib/safe-area";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";

export type FeedTab = "latest" | "pinned";

interface Props {
  activeTab?: FeedTab;
  onTabChange?: (tab: FeedTab) => void;
  title?: string;
}

const FeedHeader = ({ activeTab = "latest", onTabChange, title }: Props) => {
  const t = useTranslate();

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "latest", label: t("common.home") },
    { id: "pinned", label: t("layout.pinned-tab") },
  ];

  return (
    <header
      className={cn(
        MOBILE_SECONDARY_STICKY_TOP_CLASS,
        GLASS_CHROME_CLASS,
        "max-md:border-b-0 md:border-b md:border-border/50 md:top-0",
      )}
    >
      {title && (
        <div className="flex h-[53px] items-center px-4">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
      )}
      {!title && (
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                "relative flex h-[53px] flex-1 items-center justify-center text-[15px] transition-colors hover:bg-accent/50",
                activeTab === tab.id ? "font-bold text-foreground" : "font-normal text-muted-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 h-1 w-14 rounded-full bg-[var(--x-accent)]" />}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

export default FeedHeader;
