import { useEffect, useState } from "react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { MOBILE_HEADER_TOP_PADDING_CLASS } from "@/lib/safe-area";
import { cn } from "@/lib/utils";
import NavigationDrawer from "./NavigationDrawer";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

const MobileHeader = (props: Props) => {
  const { className, children } = props;
  const [offsetTop, setOffsetTop] = useState(() => (typeof window === "undefined" ? 0 : window.scrollY));
  const md = useMediaQuery("md");
  const sm = useMediaQuery("sm");

  useEffect(() => {
    const handleScroll = () => {
      setOffsetTop(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (md) return null;

  return (
    <div
      className={cn(
        "sticky top-0 pb-2 sm:mb-1 px-4 sm:px-6 bg-background bg-opacity-80 backdrop-blur-lg flex flex-row justify-between items-center w-full h-auto flex-nowrap shrink-0 z-1",
        MOBILE_HEADER_TOP_PADDING_CLASS,
        offsetTop > 0 && "shadow-md",
        className,
      )}
    >
      {!sm && <NavigationDrawer />}
      <div className="w-full flex flex-row justify-end items-center">{children}</div>
    </div>
  );
};

export default MobileHeader;
