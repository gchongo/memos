const scrollKey = (path: string) => `memos:scroll:${path}`;

export const saveScrollForPath = (path: string) => {
  sessionStorage.setItem(scrollKey(path), String(window.scrollY));
};

export const consumeScrollForPath = (path: string): number | null => {
  const raw = sessionStorage.getItem(scrollKey(path));
  if (raw === null) {
    return null;
  }
  sessionStorage.removeItem(scrollKey(path));
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const restoreScrollForPath = (path: string) => {
  const targetY = consumeScrollForPath(path);
  if (targetY === null) {
    return;
  }

  const restore = () => {
    window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(restore);
  });
};
