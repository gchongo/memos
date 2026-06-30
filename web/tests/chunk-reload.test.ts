import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "@/utils/chunk-reload";

describe("isChunkLoadError", () => {
  it("detects dynamic import failures", () => {
    expect(
      isChunkLoadError(
        new TypeError("Failed to fetch dynamically imported module: https://example.com/assets/Explore-CDKEPNP1.js"),
      ),
    ).toBe(true);
  });

  it("detects css chunk failures", () => {
    expect(isChunkLoadError(new Error("Loading CSS chunk index-z9QPAVlx.css failed"))).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
  });
});
