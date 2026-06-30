const CHUNK_RELOAD_KEY = "memos-chunk-reload";
const MAX_CHUNK_RELOAD_ATTEMPTS = 2;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Failed to load module script") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk")
  );
}

/** Reload with a cache-busting query param so stale index.html is not reused. */
export function reloadForStaleDeployment(): boolean {
  const attempts = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0");
  if (attempts >= MAX_CHUNK_RELOAD_ATTEMPTS) {
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(attempts + 1));

  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

export function clearChunkReloadFlag(): void {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}

export function registerChunkLoadRecovery(): void {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadForStaleDeployment();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) {
      return;
    }
    event.preventDefault();
    reloadForStaleDeployment();
  });
}
