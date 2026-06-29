import SearchBar from "@/components/SearchBar";
import XWidgetCard from "@/components/XWidgetCard";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router";
import type { StatisticsData } from "@/types/statistics";
import { useTranslate } from "@/utils/i18n";
import StatisticsView from "../StatisticsView";
import ShortcutsSection from "./ShortcutsSection";
import TagsSection from "./TagsSection";

export type MemoExplorerContext = "home" | "explore" | "archived" | "profile";

export interface MemoExplorerFeatures {
  search?: boolean;
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
}

const getDefaultFeatures = (context: MemoExplorerContext): MemoExplorerFeatures => {
  switch (context) {
    case "explore":
      return {
        search: true,
        statistics: true,
        shortcuts: false,
        tags: true,
      };
    case "archived":
      return {
        search: true,
        statistics: true,
        shortcuts: false,
        tags: true,
      };
    case "profile":
      return {
        search: true,
        statistics: true,
        shortcuts: false,
        tags: true,
      };
    case "home":
    default:
      return {
        search: true,
        statistics: true,
        shortcuts: true,
        tags: true,
      };
  }
};

const MemoExplorer = (props: Props) => {
  const { className, context = "home", features: featureOverrides = {}, statisticsData, tagCount } = props;
  const currentUser = useCurrentUser();
  const t = useTranslate();
  const navigate = useNavigate();

  const features = {
    ...getDefaultFeatures(context),
    ...featureOverrides,
  };

  return (
    <aside className={cn("relative flex h-full w-full flex-col items-start justify-start overflow-auto text-sidebar-foreground", className)}>
      {features.search && <SearchBar />}

      {features.statistics && (
        <XWidgetCard title={t("layout.activity")}>
          <StatisticsView statisticsData={statisticsData} />
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
        <XWidgetCard title={t("common.tags")}>
          <TagsSection readonly={context === "explore"} tagCount={tagCount} embedded />
        </XWidgetCard>
      )}
    </aside>
  );
};

export default MemoExplorer;
