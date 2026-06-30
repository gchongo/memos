import { LucideIcon } from "lucide-react";
import React from "react";
import { xSettingsNavItemClass } from "@/components/ui/x-menu-styles";

interface SectionMenuItemProps {
  text: string;
  icon: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
}

const SectionMenuItem: React.FC<SectionMenuItemProps> = ({ text, icon: IconComponent, isSelected, onClick }) => {
  return (
    <button type="button" onClick={onClick} className={xSettingsNavItemClass(isSelected)}>
      <IconComponent className="size-[22px] shrink-0 text-foreground" strokeWidth={isSelected ? 2.25 : 2} />
      <span className="truncate">{text}</span>
    </button>
  );
};

export default SectionMenuItem;
