import { BellIcon, EarthIcon, HomeIcon, PlusIcon, UserCircleIcon } from "lucide-react";
import { type MouseEvent, useCallback, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useMobileNavRefresh } from "@/hooks/useMobileNavRefresh";
import { useNotifications } from "@/hooks/useUserQueries";
import { GLASS_CHROME_CLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import UserAvatar from "./UserAvatar";

/** Visible bar height excluding the device safe-area inset. Keep in sync with MainLayout bottom padding. */
export const MOBILE_BOTTOM_NAV_HEIGHT = 64;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors",
    isActive && "text-foreground",
  );

interface MobileBottomNavProps {
  visible?: boolean;
}

const MobileBottomNav = ({ visible = true }: MobileBottomNavProps) => {
  const t = useTranslate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { openCompose } = useComposeDialog();
  const { refreshHome, refreshExplore, refreshInbox, refreshProfile } = useMobileNavRefresh();
  const { data: notifications = [] } = useNotifications();
  const composeFocusBridgeRef = useRef<HTMLInputElement>(null);
  const unreadCount = notifications.filter((n) => n.status === UserNotification_Status.UNREAD).length;

  const profilePath = currentUser ? `/u/${encodeURIComponent(currentUser.username)}` : ROUTES.AUTH;

  const handleActiveNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, isActive: boolean, onRefresh: () => void) => {
      if (!isActive) {
        return;
      }
      event.preventDefault();
      onRefresh();
    },
    [],
  );

  const handleExploreClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
      handleActiveNavClick(event, isActive, refreshExplore);
    },
    [handleActiveNavClick, refreshExplore],
  );

  const handleComposeClick = useCallback(() => {
    composeFocusBridgeRef.current?.focus({ preventScroll: true });
    openCompose();
  }, [openCompose]);

  const shellClassName = cn(
    GLASS_CHROME_CLASS,
    "fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-150 ease-in-out will-change-transform md:hidden",
    !visible && "translate-y-full",
  );

  const barClassName = "flex items-stretch justify-around px-2";

  if (!currentUser) {
    const isExploreActive = location.pathname === ROUTES.EXPLORE;
    const isAboutActive = location.pathname === ROUTES.ABOUT;

    return (
      <nav aria-label={t("layout.mobile-nav")} className={shellClassName}>
        <div className={barClassName} style={{ height: MOBILE_BOTTOM_NAV_HEIGHT }}>
          <NavLink
            className={navLinkClass}
            to={ROUTES.EXPLORE}
            end
            viewTransition
            onClick={(event) => handleExploreClick(event, isExploreActive)}
          >
            <EarthIcon className="h-7 w-7" strokeWidth={2} />
          </NavLink>
          <NavLink
            className={navLinkClass}
            to={ROUTES.ABOUT}
            viewTransition
            onClick={(event) => handleActiveNavClick(event, isAboutActive, () => window.scrollTo({ top: 0, behavior: "smooth" }))}
          >
            <UserCircleIcon className="h-7 w-7" strokeWidth={2} />
          </NavLink>
          <NavLink className={navLinkClass} to={ROUTES.AUTH} viewTransition>
            <span className="text-xs font-medium">{t("common.sign-in")}</span>
          </NavLink>
        </div>
        <div aria-hidden className="h-[env(safe-area-inset-bottom,0px)]" />
      </nav>
    );
  }

  const isHomeActive = location.pathname === ROUTES.HOME;
  const isExploreActive = location.pathname === ROUTES.EXPLORE;
  const isInboxActive = location.pathname === ROUTES.INBOX;
  const isProfileActive = location.pathname === profilePath;

  return (
    <nav aria-label={t("layout.mobile-nav")} className={shellClassName}>
      <input
        ref={composeFocusBridgeRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none fixed h-px w-px opacity-0"
        data-compose-focus-bridge
      />
      <div className={barClassName} style={{ height: MOBILE_BOTTOM_NAV_HEIGHT }}>
        <NavLink
          className={navLinkClass}
          to={ROUTES.HOME}
          end
          viewTransition
          onClick={(event) => handleActiveNavClick(event, isHomeActive, refreshHome)}
        >
          <HomeIcon className="h-7 w-7" strokeWidth={2} />
        </NavLink>
        <NavLink
          className={navLinkClass}
          to={ROUTES.EXPLORE}
          viewTransition
          onClick={(event) => handleExploreClick(event, isExploreActive)}
        >
          <EarthIcon className="h-7 w-7" strokeWidth={2} />
        </NavLink>
        <button
          type="button"
          aria-label={t("layout.post")}
          onClick={handleComposeClick}
          className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center py-2 text-muted-foreground transition-colors hover:text-foreground"
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
          onClick={(event) => handleActiveNavClick(event, isInboxActive, refreshInbox)}
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
        <NavLink
          className={navLinkClass}
          to={profilePath}
          viewTransition
          onClick={(event) =>
            handleActiveNavClick(event, isProfileActive, () => refreshProfile(currentUser.username))
          }
        >
          <UserAvatar className="h-8 w-8" avatarUrl={currentUser.avatarUrl} />
        </NavLink>
      </div>
      <div aria-hidden className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
};

export default MobileBottomNav;
