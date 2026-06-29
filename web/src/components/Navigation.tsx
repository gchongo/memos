import {
  BellIcon,
  BookmarkIcon,
  EarthIcon,
  HomeIcon,
  InfoIcon,
  PaperclipIcon,
  SettingsIcon,
  UserCircleIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useNotifications } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import MemosLogo from "./MemosLogo";
import UserMenu from "./UserMenu";

interface NavLinkItem {
  id: string;
  path: string;
  title: string;
  icon: React.ReactNode;
}

interface Props {
  collapsed?: boolean;
  className?: string;
}

const Navigation = (props: Props) => {
  const { collapsed, className } = props;
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const navigateTo = useNavigateTo();
  const location = useLocation();
  const { data: notifications = [] } = useNotifications();

  const homeNavLink: NavLinkItem = {
    id: "header-memos",
    path: Routes.HOME,
    title: t("common.home"),
    icon: <HomeIcon className="h-[26px] w-[26px] shrink-0" strokeWidth={location.pathname === Routes.HOME ? 2.5 : 2} />,
  };
  const exploreNavLink: NavLinkItem = {
    id: "header-explore",
    path: Routes.EXPLORE,
    title: t("common.explore"),
    icon: <EarthIcon className="h-[26px] w-[26px] shrink-0" />,
  };
  const attachmentsNavLink: NavLinkItem = {
    id: "header-attachments",
    path: Routes.ATTACHMENTS,
    title: t("common.attachments"),
    icon: <PaperclipIcon className="h-[26px] w-[26px] shrink-0" />,
  };
  const unreadCount = notifications.filter((n) => n.status === UserNotification_Status.UNREAD).length;
  const inboxNavLink: NavLinkItem = {
    id: "header-inbox",
    path: Routes.INBOX,
    title: t("common.inbox"),
    icon: (
      <div className="relative">
        <BellIcon className="h-[26px] w-[26px] shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-[var(--x-accent)] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    ),
  };
  const bookmarksNavLink: NavLinkItem = {
    id: "header-shortcuts",
    path: Routes.SHORTCUTS,
    title: t("common.shortcuts"),
    icon: <BookmarkIcon className="h-[26px] w-[26px] shrink-0" />,
  };
  const settingsNavLink: NavLinkItem = {
    id: "header-settings",
    path: Routes.SETTING,
    title: t("common.settings"),
    icon: <SettingsIcon className="h-[26px] w-[26px] shrink-0" />,
  };
  const aboutNavLink: NavLinkItem = {
    id: "header-about",
    path: Routes.ABOUT,
    title: t("common.about"),
    icon: <InfoIcon className="h-[26px] w-[26px] shrink-0" />,
  };
  const signInNavLink: NavLinkItem = {
    id: "header-auth",
    path: Routes.AUTH,
    title: t("common.sign-in"),
    icon: <UserCircleIcon className="h-[26px] w-[26px] shrink-0" />,
  };

  const primaryNavLinks: NavLinkItem[] = currentUser
    ? [homeNavLink, exploreNavLink, attachmentsNavLink, inboxNavLink, bookmarksNavLink, settingsNavLink]
    : [exploreNavLink, aboutNavLink, signInNavLink];
  const inboxAriaLabel = unreadCount > 0 ? `${t("common.inbox")}, ${unreadCount} unread` : t("common.inbox");

  const handlePost = () => {
    navigateTo(Routes.HOME);
    window.setTimeout(() => {
      document.getElementById("memo-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      const editor = document.querySelector<HTMLElement>("#memo-composer [contenteditable='true'], #memo-composer textarea");
      editor?.focus();
    }, 150);
  };

  return (
    <header className={cn("flex h-full w-full flex-col justify-between overflow-auto py-1", className)}>
      <div className="flex w-full flex-col items-start gap-1 overflow-auto overflow-x-hidden">
        <NavLink className="mb-1 cursor-default rounded-full p-3 transition-colors hover:bg-accent" to={currentUser ? Routes.HOME : Routes.EXPLORE}>
          <MemosLogo collapsed={collapsed ?? false} />
        </NavLink>
        <TooltipProvider>
          {primaryNavLinks.map((navLink) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "group flex w-full max-w-[234px] flex-row items-center gap-5 rounded-full px-3 py-3 text-[20px] transition-colors hover:bg-accent",
                  isActive ? "font-bold text-foreground" : "font-normal text-foreground",
                )
              }
              key={navLink.id}
              to={navLink.path}
              end={navLink.path === Routes.HOME}
              id={navLink.id}
              aria-label={navLink.id === "header-inbox" ? inboxAriaLabel : undefined}
              viewTransition
            >
              {props.collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>{navLink.icon}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{navLink.title}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  {navLink.icon}
                  <span className="truncate">{navLink.title}</span>
                </>
              )}
            </NavLink>
          ))}
        </TooltipProvider>

        {currentUser && !collapsed && (
          <button
            type="button"
            onClick={handlePost}
            className="mt-4 mb-2 w-full max-w-[234px] rounded-full bg-primary py-3.5 text-[17px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("layout.post")}
          </button>
        )}
      </div>

      {currentUser && (
        <div className={cn("mb-3 w-full max-w-[234px]", props.collapsed ? "flex justify-center" : "")}>
          <UserMenu collapsed={collapsed} variant="x" />
        </div>
      )}
    </header>
  );
};

export default Navigation;
