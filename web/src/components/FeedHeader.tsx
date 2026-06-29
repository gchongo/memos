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
    { id: "latest", label: t("layout.for-you") },
    { id: "pinned", label: t("layout.pinned-tab") },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
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
