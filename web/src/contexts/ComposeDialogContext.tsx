import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface ComposeDialogContextValue {
  open: boolean;
  openCompose: () => void;
  closeCompose: () => void;
}

const ComposeDialogContext = createContext<ComposeDialogContextValue | null>(null);

export const ComposeDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  const openCompose = useCallback(() => setOpen(true), []);
  const closeCompose = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, openCompose, closeCompose }), [open, openCompose, closeCompose]);

  return <ComposeDialogContext.Provider value={value}>{children}</ComposeDialogContext.Provider>;
};

export const useComposeDialog = (): ComposeDialogContextValue => {
  const context = useContext(ComposeDialogContext);
  if (!context) {
    throw new Error("useComposeDialog must be used within ComposeDialogProvider");
  }
  return context;
};
