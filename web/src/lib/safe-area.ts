/** Sticky header offset for PWA / notch devices (pairs with viewport-fit=cover in index.html). */
export const SAFE_STICKY_TOP_CLASS = "sticky top-0 pt-[env(safe-area-inset-top,0px)]";

export const MOBILE_HEADER_TOP_PADDING_CLASS =
  "pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]";
