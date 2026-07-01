import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VideoPoster from "@/components/VideoPoster";
import * as videoPoster from "@/utils/video-poster";

class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  disconnect() {}
  unobserve() {}
}

describe("<VideoPoster>", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("shows a placeholder before the poster is resolved", async () => {
    vi.spyOn(videoPoster, "resolveVideoPosterUrl").mockImplementation(() => new Promise(() => undefined));

    render(<VideoPoster sourceUrl="/file/attachments/video/video.mp4" alt="clip.mp4" className="h-20 w-20" />);

    expect(screen.getByTestId("video-poster-placeholder")).toBeInTheDocument();
  });

  it("renders a resolved poster image", async () => {
    vi.spyOn(videoPoster, "resolveVideoPosterUrl").mockResolvedValue("data:image/jpeg;base64,poster");

    render(<VideoPoster sourceUrl="/file/attachments/video/video.mp4" alt="clip.mp4" className="h-20 w-20" />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "clip.mp4" })).toHaveAttribute("src", "data:image/jpeg;base64,poster");
    });
  });
});
