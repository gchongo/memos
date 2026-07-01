import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyPosterUrl } from "@/utils/video-poster";

describe("verifyPosterUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns true when HEAD responds with an image content type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "image/jpeg" : null),
        },
      }),
    );

    await expect(verifyPosterUrl("/file/attachments/a/video.mp4?thumbnail=true")).resolves.toBe(true);
  });

  it("returns false without refetching when the poster URL was already missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => null },
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = "/file/attachments/b/video.mp4?thumbnail=true&probe=1";
    await expect(verifyPosterUrl(url)).resolves.toBe(false);
    await expect(verifyPosterUrl(url)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
