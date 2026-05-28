// Minimal service worker — required for Chrome PWA installability.
// No offline caching yet; just a network passthrough.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
