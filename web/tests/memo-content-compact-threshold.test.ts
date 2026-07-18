import { describe, expect, it } from "vitest";
import {
  COMPACT_MODE_CONFIG,
  estimateContentNeedsCompact,
  getCompactTriggerHeightPx,
  getPreviewMaxHeightPx,
  isPastCompactContentFloor,
  shouldCompactContent,
} from "@/components/MemoContent/constants";

describe("compact folded preview sizing", () => {
  it("clamps the collapsed preview to fewer rows than the fold trigger", () => {
    // Preview must be shorter than the trigger, otherwise folding shows everything.
    expect(COMPACT_MODE_CONFIG.previewRows).toBeLessThan(COMPACT_MODE_CONFIG.triggerRows);
    expect(getPreviewMaxHeightPx()).toBeLessThan(getCompactTriggerHeightPx());
  });

  it("requires more than 250 characters before folding", () => {
    expect(COMPACT_MODE_CONFIG.minContentLength).toBe(250);
    expect(isPastCompactContentFloor("a".repeat(250))).toBe(false);
    expect(isPastCompactContentFloor("a".repeat(251))).toBe(true);
  });

  it("folds only when content is taller than the trigger height", () => {
    const trigger = getCompactTriggerHeightPx();
    expect(shouldCompactContent(trigger + 1, trigger)).toBe(true);
  });

  it("leaves content at or below the trigger height fully expanded", () => {
    const trigger = getCompactTriggerHeightPx();
    // A memo a row or two over the preview but within the buffer stays open.
    expect(shouldCompactContent(getPreviewMaxHeightPx() + 1, trigger)).toBe(false);
    expect(shouldCompactContent(trigger, trigger)).toBe(false);
  });

  it("estimates long plain-text memos as compactable before layout is measured", () => {
    const longByLines = Array.from({ length: COMPACT_MODE_CONFIG.triggerRows + 2 }, () => "x".repeat(20)).join("\n");
    const longByChars = "x".repeat(COMPACT_MODE_CONFIG.triggerRows * 28 + 1);
    expect(longByLines.length).toBeGreaterThan(COMPACT_MODE_CONFIG.minContentLength);
    expect(estimateContentNeedsCompact(longByLines)).toBe(true);
    expect(estimateContentNeedsCompact(longByChars)).toBe(true);
    expect(estimateContentNeedsCompact("short memo")).toBe(false);
    expect(estimateContentNeedsCompact("a".repeat(COMPACT_MODE_CONFIG.minContentLength))).toBe(false);
  });
});
