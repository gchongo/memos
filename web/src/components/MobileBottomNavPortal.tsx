import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MobileBottomNav from "@/components/MobileBottomNav";

interface Props {
  visible?: boolean;
}

/** Portals the fixed bottom nav to `document.body` so iOS PWA flex layouts cannot break `position: fixed`. */
const MobileBottomNavPortal = ({ visible = true }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(<MobileBottomNav visible={visible} />, document.body);
};

export default MobileBottomNavPortal;
