export const registerServiceWorker = (): void => {
  if (!import.meta.env.PROD) {
    return;
  }

  void import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          registration.update().catch(() => undefined);
        }
      },
    });
  });
};
