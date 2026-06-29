import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

export interface ComposeQuoteTarget {
  name: string;
  snippet: string;
  content: string;
}

interface ComposeDialogContextValue {
  open: boolean;
  quoteTarget?: ComposeQuoteTarget;
  openCompose: () => void;
  openComposeWithQuote: (memo: Memo) => void;
  closeCompose: () => void;
}

const ComposeDialogContext = createContext<ComposeDialogContextValue | null>(null);

export const ComposeDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<ComposeQuoteTarget | undefined>();

  const openCompose = useCallback(() => {
    setQuoteTarget(undefined);
    setOpen(true);
  }, []);

  const openComposeWithQuote = useCallback((memo: Memo) => {
    setQuoteTarget({
      name: memo.name,
      snippet: memo.snippet,
      content: memo.content,
    });
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setQuoteTarget(undefined);
  }, []);

  const value = useMemo(
    () => ({ open, quoteTarget, openCompose, openComposeWithQuote, closeCompose }),
    [open, quoteTarget, openCompose, openComposeWithQuote, closeCompose],
  );

  return <ComposeDialogContext.Provider value={value}>{children}</ComposeDialogContext.Provider>;
};

export const useComposeDialog = (): ComposeDialogContextValue => {
  const context = useContext(ComposeDialogContext);
  if (!context) {
    throw new Error("useComposeDialog must be used within ComposeDialogProvider");
  }
  return context;
};
