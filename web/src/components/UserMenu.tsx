import {
  ArchiveIcon,
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  GlobeIcon,
  InfoIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  SettingsIcon,
  SquareUserIcon,
  User2Icon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSSEConnectionStatus } from "@/hooks/useLiveMemoRefresh";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useUpdateUserGeneralSetting } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { getLocaleWithFallback, loadLocale, useTranslate } from "@/utils/i18n";
import { getThemeWithFallback, loadTheme, THEME_OPTIONS } from "@/utils/theme";
import { LocaleSearchList } from "./LocalePicker";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { xMenuContentClass, xMenuItemClass, xMenuSubTriggerClass } from "./ui/x-menu-styles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type XMenuView = "main" | "language" | "theme";

interface Props {
  collapsed?: boolean;
  variant?: "default" | "x";
}

const UserMenu = (props: Props) => {
  const { collapsed, variant = "default" } = props;
  const isX = variant === "x";
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const { userGeneralSetting, refetchSettings, logout } = useAuth();
  const { mutate: updateUserGeneralSetting } = useUpdateUserGeneralSetting(currentUser?.name);
  const sseStatus = useSSEConnectionStatus();
  const currentLocale = getLocaleWithFallback(userGeneralSetting?.locale);
  const currentTheme = getThemeWithFallback(userGeneralSetting?.theme);
  const [xMenuView, setXMenuView] = useState<XMenuView>("main");

  const handleLocaleChange = async (locale: Locale) => {
    if (!currentUser) return;
    loadLocale(locale);
    updateUserGeneralSetting(
      { generalSetting: { locale }, updateMask: ["locale"] },
      {
        onSuccess: () => {
          refetchSettings();
        },
      },
    );
  };

  const handleThemeChange = async (theme: string) => {
    if (!currentUser) return;
    loadTheme(theme);
    updateUserGeneralSetting(
      { generalSetting: { theme }, updateMask: ["theme"] },
      {
        onSuccess: () => {
          refetchSettings();
        },
      },
    );
  };

  const handleSignOut = async () => {
    await logout();

    try {
      const keysToPreserve = ["memos-theme", "memos-locale", "memos-view-setting", "tag-view-as-tree", "tag-tree-auto-expand"];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore errors from localStorage operations
    }

    window.location.replace(Routes.AUTH);
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (!open) {
      setXMenuView("main");
    }
  };

  const menuItemClass = isX ? xMenuItemClass : undefined;
  const menuSubTriggerClass = isX ? xMenuSubTriggerClass : undefined;
  const xNestedMenuClass = cn(
    xMenuContentClass,
    "max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] overflow-hidden",
  );

  const renderXMainMenu = () => (
    <>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(`/u/${encodeURIComponent(currentUser?.username ?? "")}`)}>
        <SquareUserIcon />
        {t("common.profile")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.ARCHIVED)}>
        <ArchiveIcon />
        {t("common.archived")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.ABOUT)}>
        <InfoIcon />
        {t("common.about")}
      </DropdownMenuItem>
      <DropdownMenuItem
        className={menuItemClass}
        onSelect={(event) => {
          event.preventDefault();
          setXMenuView("language");
        }}
      >
        <GlobeIcon />
        {t("common.language")}
        <ChevronRightIcon className="ml-auto size-[18px] text-muted-foreground" />
      </DropdownMenuItem>
      <DropdownMenuItem
        className={menuItemClass}
        onSelect={(event) => {
          event.preventDefault();
          setXMenuView("theme");
        }}
      >
        <PaletteIcon />
        {t("setting.preference.theme")}
        <ChevronRightIcon className="ml-auto size-[18px] text-muted-foreground" />
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.SETTING)}>
        <SettingsIcon />
        {t("common.settings")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={handleSignOut}>
        <LogOutIcon />
        {t("common.sign-out")}
      </DropdownMenuItem>
    </>
  );

  const renderXLanguageMenu = () => (
    <div className="flex min-h-0 flex-col">
      <DropdownMenuItem
        className={menuItemClass}
        onSelect={(event) => {
          event.preventDefault();
          setXMenuView("main");
        }}
      >
        <ArrowLeftIcon />
        {t("common.back")}
      </DropdownMenuItem>
      <LocaleSearchList value={currentLocale} onChange={handleLocaleChange} className="w-full min-w-0" />
    </div>
  );

  const renderXThemeMenu = () => (
    <>
      <DropdownMenuItem
        className={menuItemClass}
        onSelect={(event) => {
          event.preventDefault();
          setXMenuView("main");
        }}
      >
        <ArrowLeftIcon />
        {t("common.back")}
      </DropdownMenuItem>
      {THEME_OPTIONS.map((option) => (
        <DropdownMenuItem key={option.value} className={menuItemClass} onClick={() => handleThemeChange(option.value)}>
          {currentTheme === option.value ? <CheckIcon className="size-[22px]" /> : <span className="size-[22px]" />}
          {option.label}
        </DropdownMenuItem>
      ))}
    </>
  );

  const renderDefaultMenu = () => (
    <>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(`/u/${encodeURIComponent(currentUser?.username ?? "")}`)}>
        <SquareUserIcon className="size-4 text-muted-foreground" />
        {t("common.profile")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.ARCHIVED)}>
        <ArchiveIcon className="size-4 text-muted-foreground" />
        {t("common.archived")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.ABOUT)}>
        <InfoIcon className="size-4 text-muted-foreground" />
        {t("common.about")}
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={menuSubTriggerClass}>
          <GlobeIcon className="size-4 text-muted-foreground" />
          {t("common.language")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="overflow-hidden p-0">
          <LocaleSearchList value={currentLocale} onChange={handleLocaleChange} className="w-64" />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={menuSubTriggerClass}>
          <PaletteIcon className="size-4 text-muted-foreground" />
          {t("setting.preference.theme")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.value} className={menuItemClass} onClick={() => handleThemeChange(option.value)}>
              {currentTheme === option.value ? <CheckIcon className="w-4 h-auto" /> : <span className="w-4" />}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem className={menuItemClass} onClick={() => navigateTo(Routes.SETTING)}>
        <SettingsIcon className="size-4 text-muted-foreground" />
        {t("common.settings")}
      </DropdownMenuItem>
      <DropdownMenuItem className={menuItemClass} onClick={handleSignOut}>
        <LogOutIcon className="size-4 text-muted-foreground" />
        {t("common.sign-out")}
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu onOpenChange={handleMenuOpenChange}>
      <DropdownMenuTrigger asChild disabled={!currentUser}>
        <div
          className={cn(
            "flex w-full cursor-pointer flex-row items-center text-foreground transition-colors",
            isX
              ? "max-w-[234px] gap-3 rounded-full p-3 hover:bg-accent"
              : cn("w-auto items-center justify-start", collapsed ? "px-1" : "px-3"),
          )}
        >
          <div className="relative shrink-0">
            {currentUser?.avatarUrl ? (
              <UserAvatar className={cn(isX && "h-10 w-10")} avatarUrl={currentUser?.avatarUrl} />
            ) : (
              <User2Icon className={cn("mx-auto text-muted-foreground", isX ? "h-10 w-10" : "h-auto w-6")} />
            )}
            {sseStatus !== "connected" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
                      sseStatus === "connecting" ? "animate-pulse bg-muted-foreground" : "bg-destructive",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">{t(`live-update.${sseStatus}` as Parameters<typeof t>[0])}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left leading-tight">
                <div className="truncate text-[15px] font-bold text-foreground">{currentUser?.displayName || currentUser?.username}</div>
                <div className="truncate text-[15px] text-muted-foreground">@{currentUser?.username}</div>
              </div>
              {isX && <MoreHorizontalIcon className="h-[18px] w-[18px] shrink-0 text-foreground" />}
              {!isX && (
                <span className="ml-2 grow truncate text-lg font-medium text-foreground">
                  {currentUser?.displayName || currentUser?.username}
                </span>
              )}
            </>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={isX ? "top" : "bottom"}
        sideOffset={isX ? 8 : 4}
        className={isX ? xNestedMenuClass : undefined}
      >
        {isX ? (
          <>
            {xMenuView === "main" && renderXMainMenu()}
            {xMenuView === "language" && renderXLanguageMenu()}
            {xMenuView === "theme" && renderXThemeMenu()}
          </>
        ) : (
          renderDefaultMenu()
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
