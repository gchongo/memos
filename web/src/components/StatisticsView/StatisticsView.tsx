import dayjs from "dayjs";
import { useState } from "react";
import { calculateMaxCount, MonthCalendar } from "@/components/ActivityCalendar";
import { useDateFilterNavigation } from "@/hooks";
import type { StatisticsData } from "@/types/statistics";
import { MonthNavigator } from "./MonthNavigator";

interface Props {
  statisticsData: StatisticsData;
  compact?: boolean;
}

const StatisticsView = (props: Props) => {
  const { statisticsData, compact = false } = props;
  const { activityStats, timeBasis } = statisticsData;
  const navigateToDateFilter = useDateFilterNavigation();
  const [visibleMonthString, setVisibleMonthString] = useState(dayjs().format("YYYY-MM"));

  return (
    <div className={compact ? "group flex w-full flex-col text-muted-foreground" : "group mt-2 flex w-full flex-col text-muted-foreground animate-fade-in"}>
      <MonthNavigator
        visibleMonth={visibleMonthString}
        onMonthChange={setVisibleMonthString}
        activityStats={activityStats}
        timeBasis={timeBasis}
      />

      <div className="w-full min-w-0 animate-scale-in">
        <MonthCalendar
          month={visibleMonthString}
          data={activityStats}
          maxCount={calculateMaxCount(activityStats)}
          onClick={navigateToDateFilter}
          timeBasis={timeBasis}
          size={compact ? "small" : "default"}
        />
      </div>
    </div>
  );
};

export default StatisticsView;
