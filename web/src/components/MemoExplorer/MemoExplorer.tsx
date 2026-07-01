import ExploreTrendsWidget, { SIDEBAR_WIDGET_CARD_CLASS, SIDEBAR_WIDGET_CARD_STYLE } from "@/components/ExploreTrendsWidget";
import FollowSuggestionsWidget from "@/components/FollowSuggestionsWidget";
import { GLASS_CHROME_CLASS } from "@/lib/glass";
import SearchBar from "@/components/SearchBar";
import TagsCloudWidget from "@/components/TagsCloudWidget";
import XWidgetCard from "@/components/XWidgetCard";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import type { StatisticsData } from "@/types/statistics";
import { useTranslate } from "@/utils/i18n";
import StatisticsView from "../StatisticsView";
import ShortcutsSection from "./ShortcutsSection";
import TagsSection from "./TagsSection";

export type MemoExplorerContext = "home" | "explore" | "archived" | "profile" | "inbox";

export interface MemoExplorerFeatures {
  search?: boolean;
  exploreTrends?: boolean;
  whoToFollow?: boolean;
  tagCloud?: boolean;
  statistics?: boolean;
  shortcuts?: boolean;
  tags?: boolean;
}

interface Props {
  className?: string;
  context?: MemoExplorerContext;
  features?: MemoExplorerFeatures;
  statisticsData: StatisticsData;
  tagCount: Record<string, number>;
  /** When false, search scrolls with sidebar content (mobile drawer). */
  stickySearch?: boolean;
}

const getDefaultFeatures = (context: MemoExplorerContext): MemoExplorerFeatures => {
  switch (context) {
    case "explore":
      return {
        search: true,
        exploreTrends: true,
        whoToFollow: true,
        tagCloud: true,
        statistics: false,
        shortcuts: false,
        tags: false,
      };
    case "inbox":
      return {
        search: true,
        exploreTrends: true,
        whoToFollow: true,
        tagCloud: true,
        statistics: false,
        shortcuts: false,
        tags: false,
      };
    case "archived":
      return {
        search: true,
        exploreTrends: false,
        statistics: true,
        shortcuts: false,
        tags: true,
      };
    case "profile":
      return {
        search: true,
        exploreTrends: false,
        statistics: true,
        shortcuts: false,
        tags: true,
      };
    case "home":
    default:
      return {
        search: true,
        exploreTrends: true,
        whoToFollow: true,
        tagCloud: true,
        statistics: false,
        shortcuts: false,
        tags: false,
      };
  }
};

const MemoExplorer = (props: Props) => {
  const { className, context = "home", features: featureOverrides = {}, statisticsData, tagCount, stickySearch = true } = props;
  const currentUser = useCurrentUser();
  const t = useTranslate();
  const navigate = useNavigate();

  const features = {
    ...getDefaultFeatures(context),
    ...featureOverrides,
  };

  return (
    <aside className={cn("relative flex w-full min-w-0 flex-col items-start justify-start text-sidebar-foreground", className)}>
      {features.search && (
        <div className={cn("w-full pb-1", stickySearch && cn("sticky top-0 z-10 pt-1", GLASS_CHROME_CLASS))}>
          <SearchBar className={stickySearch ? undefined : "mb-3"} />
        </div>
      )}

      {features.exploreTrends && <ExploreTrendsWidget />}

      {features.whoToFollow && <FollowSuggestionsWidget />}

      {features.tagCloud && <TagsCloudWidget tagCount={tagCount} readonly={context === "explore"} />}

      {features.statistics && (
        <XWidgetCard title={t("layout.activity")} className={SIDEBAR_WIDGET_CARD_CLASS} style={SIDEBAR_WIDGET_CARD_STYLE}>
          <StatisticsView statisticsData={statisticsData} compact />
        </XWidgetCard>
      )}

      {features.shortcuts && currentUser && (
        <XWidgetCard
          title={t("common.shortcuts")}
          action={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-full p-1 hover:bg-accent" onClick={() => navigate(ROUTES.SHORTCUTS, { state: { openCreate: true } })}>
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.create")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          <ShortcutsSection embedded />
        </XWidgetCard>
      )}

      {features.tags && (
        <XWidgetCard title={t("common.tags")} className={cn(SIDEBAR_WIDGET_CARD_CLASS, "py-0")} style={SIDEBAR_WIDGET_CARD_STYLE}>
          <TagsSection readonly={context === "explore"} tagCount={tagCount} embedded />
        </XWidgetCard>
      )}
    </aside>
  );
};

export default MemoExplorer;
