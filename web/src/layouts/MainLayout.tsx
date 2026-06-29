import { useEffect, useMemo, useState } from "react";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import type { MemoExplorerContext } from "@/components/MemoExplorer";
import { MemoExplorer, MemoExplorerDrawer } from "@/components/MemoExplorer";
import MobileHeader from "@/components/MobileHeader";
import Navigation from "@/components/Navigation";
import { userServiceClient } from "@/connect";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useFilteredMemoStats } from "@/hooks/useFilteredMemoStats";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";

const ARCHIVED_ROUTE = "/archived";
const PROFILE_ROUTE = "/u/:username";

/** Total width of the centered X column group: nav + feed + sidebar. */
const X_SHELL_MAX = "max-w-[1265px]";

const MainLayout = () => {
  const md = useMediaQuery("md");
  const xl = useMediaQuery("xl");
  const location = useLocation();
  const currentUser = useCurrentUser();
  const [profileUserName, setProfileUserName] = useState<string | undefined>();
  const showMemoExplorer = location.pathname !== Routes.ABOUT;

  const context: MemoExplorerContext = useMemo(() => {
    if (location.pathname === Routes.HOME) return "home";
    if (location.pathname === Routes.EXPLORE) return "explore";
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
    if (context === "home") return currentUser?.name;
    if (context === "profile") return profileUserName;
    return undefined;
  }, [context, currentUser, profileUserName]);

  const { statistics, tags } = useFilteredMemoStats({ userName: statsUserName, context });
  const memoExplorerProps = { context, statisticsData: statistics, tagCount: tags };

  return (
    <div className={cn("flex min-h-svh w-full justify-center bg-background px-3 sm:px-6")}>
      <div className={cn("flex w-full", X_SHELL_MAX)}>
        {md && (
          <aside className="sticky top-0 hidden h-svh w-[275px] shrink-0 flex-col px-2 md:flex">
            <Navigation />
          </aside>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          {!md && <MobileHeader>{showMemoExplorer && <MemoExplorerDrawer {...memoExplorerProps} />}</MobileHeader>}

          <div className="flex w-full min-w-0 flex-1 justify-center xl:justify-start">
            <div className="w-full min-w-0 max-w-[600px] shrink-0 border-x border-border">
              <Outlet />
            </div>

            {xl && showMemoExplorer && (
              <aside className="sticky top-0 hidden h-svh w-[350px] shrink-0 overflow-y-auto pl-6 pt-2 xl:block">
                <MemoExplorer {...memoExplorerProps} />
              </aside>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainLayout;
