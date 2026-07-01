import { useEffect, useMemo, useState } from "react";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import type { MemoExplorerContext } from "@/components/MemoExplorer";
import { MemoExplorer, MemoExplorerDrawer } from "@/components/MemoExplorer";
import { GLASS_CHROME_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass";
import MobileBottomNav, { MOBILE_BOTTOM_NAV_HEIGHT } from "@/components/MobileBottomNav";
import MobileHeader from "@/components/MobileHeader";
import Navigation from "@/components/Navigation";
import { userServiceClient } from "@/connect";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useFilteredMemoStats } from "@/hooks/useFilteredMemoStats";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useMobileBottomNavVisibility } from "@/hooks/useMobileBottomNavVisibility";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";

const ARCHIVED_ROUTE = "/archived";
const PROFILE_ROUTE = "/u/:username";

const WIDE_CONTENT_ROUTES = new Set<string>([ROUTES.SETTING, ROUTES.SHORTCUTS, ROUTES.ATTACHMENTS]);

/** Total width of the centered X column group: nav + feed + sidebar. */
const X_SHELL_MAX = "max-w-[1265px]";

const MEMO_DETAIL_ROUTE = "/memos/:uid";
const MEMO_SHARE_ROUTE = "/memos/shares/:token";

const MainLayout = () => {
  const md = useMediaQuery("md");
  const xl = useMediaQuery("xl");
  const location = useLocation();
  const currentUser = useCurrentUser();
  const [profileUserName, setProfileUserName] = useState<string | undefined>();

  const isProfilePage = Boolean(matchPath(PROFILE_ROUTE, location.pathname));
  const isMemoDetailPage = Boolean(matchPath(MEMO_DETAIL_ROUTE, location.pathname));
  const isMemoSharePage = Boolean(matchPath(MEMO_SHARE_ROUTE, location.pathname));
  const showMemoExplorer =
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.EXPLORE ||
    location.pathname === ROUTES.INBOX ||
    location.pathname === ARCHIVED_ROUTE ||
    isProfilePage ||
    isMemoDetailPage ||
    isMemoSharePage;

  const contentWidthClass = WIDE_CONTENT_ROUTES.has(location.pathname) ? "max-w-[920px]" : "max-w-[600px]";

  const context: MemoExplorerContext = useMemo(() => {
    if (matchPath(MEMO_DETAIL_ROUTE, location.pathname) || matchPath(MEMO_SHARE_ROUTE, location.pathname)) return "explore";
    if (location.pathname === ROUTES.HOME) return "home";
    if (location.pathname === ROUTES.EXPLORE) return "explore";
    if (location.pathname === ROUTES.INBOX) return "inbox";
    if (matchPath(ARCHIVED_ROUTE, location.pathname)) return "archived";
    if (matchPath(PROFILE_ROUTE, location.pathname)) return "profile";
    return "home";
  }, [location.pathname]);

  useEffect(() => {
    const match = matchPath(PROFILE_ROUTE, location.pathname);
    if (match && context === "profile") {
      const username = match.params.username;
      if (username) {
        userServiceClient
          .getUser({ name: `users/${username}` })
          .then((user) => {
            setProfileUserName(user.name);
          })
          .catch((error) => {
            console.error("Failed to fetch profile user:", error);
            setProfileUserName(undefined);
          });
      }
    } else {
      setProfileUserName(undefined);
    }
  }, [location.pathname, context]);

  const statsUserName = useMemo(() => {
    if (context === "home" || context === "inbox") return currentUser?.name;
    if (context === "profile") return profileUserName;
    return undefined;
  }, [context, currentUser, profileUserName]);

  const { statistics, tags } = useFilteredMemoStats({ userName: statsUserName, context });
  const memoExplorerProps = { context, statisticsData: statistics, tagCount: tags };
  const bottomNavVisible = useMobileBottomNavVisibility(!md);

  return (
    <div className={cn("flex min-h-svh w-full justify-center bg-background max-md:px-0 md:px-6")}>
      <div className={cn("flex w-full", X_SHELL_MAX)}>
        {md && (
          <aside className={cn("sticky top-0 hidden h-svh w-[275px] shrink-0 flex-col px-2 md:flex", GLASS_CHROME_CLASS)}>
            <Navigation />
          </aside>
        )}

        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col max-md:transition-[padding-bottom] max-md:duration-150 max-md:ease-in-out",
            bottomNavVisible
              ? "max-md:pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px))]"
              : "max-md:pb-[env(safe-area-inset-bottom,0px)]",
          )}
          style={{ ["--mobile-bottom-nav-height" as string]: `${MOBILE_BOTTOM_NAV_HEIGHT}px` }}
        >
          {!md && <MobileHeader>{showMemoExplorer && <MemoExplorerDrawer {...memoExplorerProps} />}</MobileHeader>}

          <div className="flex w-full min-w-0 flex-1 justify-center xl:justify-start">
            <div className={cn("w-full min-w-0 shrink-0 md:border-x md:border-border", contentWidthClass)}>
              <Outlet />
            </div>

            {xl && showMemoExplorer && (
              <aside className={cn("sticky top-0 hidden h-svh w-[350px] min-w-[350px] max-w-[350px] shrink-0 overflow-x-hidden overflow-y-auto pl-6 pt-2 xl:block", GLASS_PANEL_CLASS)}>
                <MemoExplorer {...memoExplorerProps} />
              </aside>
            )}
          </div>
        </section>
      </div>
      {!md && <MobileBottomNav visible={bottomNavVisible} />}
    </div>
  );
};

export default MainLayout;
