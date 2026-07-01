import { cn } from "@/lib/utils";

/** X-style floating menu panel (popover / dropdown). */
export const xMenuContentClass =
  "z-dropdown min-w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-popover p-0 text-popover-foreground shadow-[0_0_15px_rgba(0,0,0,0.35)]";

/** X-style menu row: icon + label, generous padding. */
export const xMenuItemClass =
  "relative flex cursor-pointer items-center gap-4 px-4 py-3 text-[15px] font-normal text-foreground outline-none transition-colors focus:bg-accent hover:bg-accent data-[highlighted]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-[22px] [&_svg]:shrink-0 [&_svg]:text-foreground";

/** X-style submenu trigger with chevron on the right (opens downward in sidebar menus). */
export const xMenuSubTriggerClass = cn(
  xMenuItemClass,
  "data-[state=open]:bg-accent [&>svg:last-child]:ml-auto [&>svg:last-child]:size-[18px] [&>svg:last-child]:rotate-90 [&>svg:last-child]:text-muted-foreground",
);

/** X-style nested submenu panel. */
export const xMenuSubContentClass =
  "z-dropdown min-w-[280px] overflow-hidden rounded-2xl border border-border/60 bg-popover p-0 shadow-[0_0_15px_rgba(0,0,0,0.35)]";

/** X-style settings sidebar row (selected = bold, hover = accent pill). */
export const xSettingsNavItemClass = (isSelected: boolean) =>
  cn(
    "flex w-full max-w-full cursor-pointer items-center gap-4 rounded-full px-4 py-3 text-[15px] transition-colors hover:bg-accent",
    isSelected ? "font-bold text-foreground" : "font-normal text-foreground",
  );
