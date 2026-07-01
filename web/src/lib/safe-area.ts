/** Topmost mobile bar (logo row): safe-area padding lives here only once. */
export const MOBILE_HEADER_TOP_PADDING_CLASS =
  "sticky top-0 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-1";

/**
 * Secondary sticky bars under MobileHeader (feed tabs, detail title, etc.).
 * Uses sticky `top` offset only — no extra padding, so there is no double safe-area gap.
 */
export const MOBILE_SECONDARY_STICKY_TOP_CLASS =
  "sticky top-0 z-10 max-md:top-[env(safe-area-inset-top,0px)]";

/** Standalone sticky page header when MobileHeader is not shown above (rare on mobile). */
export const SAFE_STICKY_TOP_CLASS = "sticky top-0 pt-[env(safe-area-inset-top,0px)]";
