import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  style?: React.CSSProperties;
}

const XWidgetCard = ({ title, children, className, action, style }: Props) => (
  <div className={cn("mb-4 overflow-hidden rounded-2xl bg-card", className)} style={style}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 pt-3">
        {title && <h2 className="text-xl font-extrabold text-foreground">{title}</h2>}
        {action}
      </div>
    )}
    <div className="px-4 py-3">{children}</div>
  </div>
);

export default XWidgetCard;
