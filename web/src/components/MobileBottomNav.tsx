import { BellIcon, EarthIcon, HomeIcon, PlusIcon, UserCircleIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useComposeDialog } from "@/contexts/ComposeDialogContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import UserAvatar from "./UserAvatar";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-muted-foreground transition-colors",
    isActive && "text-foreground",
  );

const MobileBottomNav = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { openCompose } = useComposeDialog();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => n.status === UserNotification_Status.UNREAD).length;

  const profilePath = currentUser ? `/u/${encodeURIComponent(currentUser.username)}` : ROUTES.AUTH;

  if (!currentUser) {
    return (
      <nav
        aria-label={t("layout.mobile-nav")}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[53px] items-stretch justify-around bg-background/90 px-1 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <NavLink className={navLinkClass} to={ROUTES.EXPLORE} end viewTransition>
          <EarthIcon className="h-[26px] w-[26px]" strokeWidth={2} />
        </NavLink>
        <NavLink className={navLinkClass} to={ROUTES.ABOUT} viewTransition>
          <UserCircleIcon className="h-[26px] w-[26px]" strokeWidth={2} />
        </NavLink>
        <NavLink className={navLinkClass} to={ROUTES.AUTH} viewTransition>
          <span className="text-[11px] font-medium">{t("common.sign-in")}</span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t("layout.mobile-nav")}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[53px] items-stretch justify-around bg-background/90 px-1 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <NavLink className={navLinkClass} to={ROUTES.HOME} end viewTransition>
        <HomeIcon className="h-[26px] w-[26px]" strokeWidth={2} />
      </NavLink>
      <NavLink className={navLinkClass} to={ROUTES.EXPLORE} viewTransition>
        <EarthIcon className="h-[26px] w-[26px]" strokeWidth={2} />
      </NavLink>
      <button
        type="button"
        aria-label={t("layout.post")}
        onClick={openCompose}
        className="flex flex-1 flex-col items-center justify-center py-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-primary-foreground">
          <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </span>
      </button>
      <NavLink className={navLinkClass} to={ROUTES.INBOX} viewTransition aria-label={unreadCount > 0 ? `${t("common.inbox")}, ${unreadCount}` : t("common.inbox")}>
        <div className="relative">
          <BellIcon className="h-[26px] w-[26px]" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--x-accent)] px-0.5 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </NavLink>
      <NavLink className={navLinkClass} to={profilePath} viewTransition>
        <UserAvatar className="h-[26px] w-[26px]" avatarUrl={currentUser.avatarUrl} />
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;
