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
      <div className="w-full px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full flex-row items-start justify-start overflow-hidden rounded-2xl border border-border bg-card text-muted-foreground">
          {sm && (
            <div className="flex h-auto w-44 shrink-0 flex-col items-start justify-start border-r border-border/50 py-3 pl-1 pr-2">
              <span className="text-sm mt-0.5 pl-3 font-mono select-none text-muted-foreground">{t("common.basic")}</span>
              <div className="w-full flex flex-col justify-start items-start mt-1">{renderSectionMenuItems(sectionGroups.basic)}</div>
              {isHost && (
                <>
                  <span className="text-sm mt-4 pl-3 font-mono select-none text-muted-foreground">{t("common.admin")}</span>
                  <div className="w-full flex flex-col justify-start items-start mt-1">
                    {renderSectionMenuItems(sectionGroups.admin)}
                    <div className="px-3 mt-2 opacity-70 text-sm leading-5">
                      {t("setting.version")}: {profile.version}
                      {profile.commit && (
                        <span className="block font-mono break-all">
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
                  </div>
                </>
              )}
            </div>
          )}
          <div className="w-full min-w-0 grow overflow-x-auto p-4 sm:p-6">
            {!sm && (
              <div className="mb-4 inline-block w-auto">
                <Select value={selectedSection} onValueChange={(value) => handleSectionSelectorItemClick(value as SettingSectionKey)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("setting.select-section")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionGroups.all.map((section) => (
                      <SelectItem key={section.key} value={section.key}>
                        {t(section.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
