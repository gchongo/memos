import { BellIcon, EarthIcon, HomeIcon, PlusIcon, UserCircleIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import UserAvatar from "./UserAvatar";

/** Icon row height. Keep in sync with MainLayout bottom padding. */
export const MOBILE_BOTTOM_NAV_HEIGHT = 64;
/** Fallback when env(safe-area-inset-bottom) is 0 (requires viewport-fit=cover). ~iOS home indicator. */
export const MOBILE_BOTTOM_NAV_MIN_SAFE_BOTTOM = 34;

export const mobileBottomNavStyleVars = {
  ["--mobile-bottom-nav-height" as string]: `${MOBILE_BOTTOM_NAV_HEIGHT}px`,
  ["--mobile-bottom-nav-min-safe-bottom" as string]: `${MOBILE_BOTTOM_NAV_MIN_SAFE_BOTTOM}px`,
} satisfies CSSProperties;

const navShellStyle: CSSProperties = {
  ...mobileBottomNavStyleVars,
  paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${MOBILE_BOTTOM_NAV_MIN_SAFE_BOTTOM}px)`,
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-muted-foreground transition-colors",
    isActive && "text-foreground",
  );

interface MobileBottomNavProps {
  visible?: boolean;
}

const MobileBottomNav = ({ visible = true }: MobileBottomNavProps) => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { openCompose } = useComposeDialog();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => n.status === UserNotification_Status.UNREAD).length;

  const profilePath = currentUser ? `/u/${encodeURIComponent(currentUser.username)}` : ROUTES.AUTH;

  const shellClassName = cn(
    "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background/90 backdrop-blur-md transition-transform duration-300 ease-in-out will-change-transform md:hidden",
    !visible && "translate-y-full",
  );

  const barClassName = "flex shrink-0 items-stretch justify-around px-2";

  if (!currentUser) {
    return (
      <nav aria-label={t("layout.mobile-nav")} className={shellClassName} style={navShellStyle}>
        <div className={barClassName} style={{ height: MOBILE_BOTTOM_NAV_HEIGHT }}>
          <NavLink className={navLinkClass} to={ROUTES.EXPLORE} end viewTransition>
            <EarthIcon className="h-7 w-7" strokeWidth={2} />
          </NavLink>
          <NavLink className={navLinkClass} to={ROUTES.ABOUT} viewTransition>
            <UserCircleIcon className="h-7 w-7" strokeWidth={2} />
          </NavLink>
          <NavLink className={navLinkClass} to={ROUTES.AUTH} viewTransition>
            <span className="text-xs font-medium">{t("common.sign-in")}</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={t("layout.mobile-nav")} className={shellClassName} style={navShellStyle}>
      <div className={barClassName} style={{ height: MOBILE_BOTTOM_NAV_HEIGHT }}>
        <NavLink className={navLinkClass} to={ROUTES.HOME} end viewTransition>
          <HomeIcon className="h-7 w-7" strokeWidth={2} />
        </NavLink>
        <NavLink className={navLinkClass} to={ROUTES.EXPLORE} viewTransition>
          <EarthIcon className="h-7 w-7" strokeWidth={2} />
        </NavLink>
        <button
          type="button"
          aria-label={t("layout.post")}
          onClick={openCompose}
          className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <PlusIcon className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </button>
        <NavLink
          className={navLinkClass}
          to={ROUTES.INBOX}
          viewTransition
          aria-label={unreadCount > 0 ? `${t("common.inbox")}, ${unreadCount}` : t("common.inbox")}
        >
          <div className="relative">
            <BellIcon className="h-7 w-7" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--x-accent)] px-0.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </NavLink>
        <NavLink className={navLinkClass} to={profilePath} viewTransition>
          <UserAvatar className="h-8 w-8" avatarUrl={currentUser.avatarUrl} />
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
