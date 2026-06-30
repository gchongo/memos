import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import FeedHeader from "@/components/FeedHeader";
import SectionMenuItem from "@/components/Settings/SectionMenuItem";
import {
  DEFAULT_SETTING_SECTION,
  isSettingSectionKey,
  SETTINGS_SECTIONS,
  type SettingSectionDefinition,
  type SettingSectionKey,
} from "@/components/Settings/settingSections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstance } from "@/contexts/InstanceContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { User_Role } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

const GITHUB_COMMIT_URL_PREFIX = "https://github.com/usememos/memos/commit/";

const isCommitSha = (commit: string) => /^[0-9a-f]{7,40}$/i.test(commit);

const Setting = () => {
  const t = useTranslate();
  const sm = useMediaQuery("sm");
  const location = useLocation();
  const user = useCurrentUser();
  const { profile, fetchSettings } = useInstance();
  const [selectedSection, setSelectedSection] = useState<SettingSectionKey>(DEFAULT_SETTING_SECTION);
  const isHost = user?.role === User_Role.ADMIN;
  const commitUrl = isCommitSha(profile.commit) ? `${GITHUB_COMMIT_URL_PREFIX}${profile.commit}` : "";

  const sectionGroups = useMemo(() => {
    const visibleSections = SETTINGS_SECTIONS.filter((section) => section.scope === "basic" || isHost);
    return {
      basic: visibleSections.filter((section) => section.scope === "basic"),
      admin: visibleSections.filter((section) => section.scope === "admin"),
      all: visibleSections,
    };
  }, [isHost]);

  const visibleSectionKeys = useMemo(() => new Set(sectionGroups.all.map((section) => section.key)), [sectionGroups.all]);

  useEffect(() => {
    const hash = location.hash.slice(1);
    const nextSection = isSettingSectionKey(hash) && visibleSectionKeys.has(hash) ? hash : DEFAULT_SETTING_SECTION;
    setSelectedSection(nextSection);
  }, [location.hash, visibleSectionKeys]);

  useEffect(() => {
    if (!isHost) {
      return;
    }
    const preloadSettingKeys = new Set(sectionGroups.admin.flatMap((section) => section.preloadSettingKeys ?? []));
    void fetchSettings([...preloadSettingKeys]);
  }, [fetchSettings, isHost, sectionGroups.admin]);

  const handleSectionSelectorItemClick = (section: SettingSectionKey) => {
    window.location.hash = section;
  };

  const selectedSectionDefinition =
    sectionGroups.all.find((section) => section.key === selectedSection) ??
    SETTINGS_SECTIONS.find((section) => section.key === DEFAULT_SETTING_SECTION) ??
    SETTINGS_SECTIONS[0];
  const ActiveSection = selectedSectionDefinition.component;

  const renderSectionMenuItems = (sections: SettingSectionDefinition[]) =>
    sections.map((section) => (
      <SectionMenuItem
        key={section.key}
        text={t(section.labelKey)}
        icon={section.icon}
        isSelected={selectedSection === section.key}
        onClick={() => handleSectionSelectorItemClick(section.key)}
      />
    ));

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader title={t("common.settings")} />
      <div className="mx-auto flex w-full max-w-[1050px] flex-col sm:flex-row sm:min-h-[calc(100dvh-53px)]">
        {sm && (
          <aside className="w-full shrink-0 border-b border-border px-2 py-3 sm:w-[275px] sm:border-b-0 sm:border-r sm:py-4">
            <div className="flex flex-col gap-0.5">{renderSectionMenuItems(sectionGroups.basic)}</div>
            {isHost && (
              <>
                <p className="mt-4 px-4 text-[13px] font-bold text-foreground">{t("common.admin")}</p>
                <div className="mt-1 flex flex-col gap-0.5">{renderSectionMenuItems(sectionGroups.admin)}</div>
                <div className="mt-4 px-4 text-[13px] leading-5 text-muted-foreground">
                  {t("setting.version")}: {profile.version}
                  {profile.commit && (
                    <span className="mt-1 block break-all font-mono text-xs">
                      Commit:{" "}
                      {commitUrl ? (
                        <a className="underline hover:text-foreground" href={commitUrl} target="_blank" rel="noreferrer">
                          {profile.commit}
                        </a>
                      ) : (
                        profile.commit
                      )}
                    </span>
                  )}
                </div>
              </>
            )}
          </aside>
        )}
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-8 sm:py-6">
          {!sm && (
            <div className="mb-4 inline-block w-auto">
              <Select value={selectedSection} onValueChange={(value) => handleSectionSelectorItemClick(value as SettingSectionKey)}>
                <SelectTrigger className="h-11 w-full min-w-[220px] rounded-full border-border bg-card">
                  <SelectValue placeholder={t("setting.select-section")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/60 p-0">
                  {sectionGroups.all.map((section) => (
                    <SelectItem key={section.key} value={section.key} className="rounded-none px-4 py-3 text-[15px]">
                      {t(section.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={cn(!sm && "mt-2")}>
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
