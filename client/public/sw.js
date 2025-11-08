// Update this version number whenever you deploy breaking changes
const CACHE_VERSION = "zapygo-v2";
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;
const urlsToCache = ["/", "/manifest.json"];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...", CACHE_NAME);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        // Only cache essential files that exist
        return cache.addAll(
          urlsToCache.filter((url) => url === "/" || url === "/manifest.json")
        );
      })
      .catch((error) => {
        console.error("Cache addAll failed:", error);
        // Don't fail installation if caching fails
        return Promise.resolve();
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip caching for API requests and hot reload
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/@vite/") ||
    event.request.url.includes("/__vite_ping") ||
    event.request.url.includes("/src/") ||
    event.request.url.includes(".hot-update.")
  ) {
    return;
  }

  event.respondWith(
    // Network first, then cache (better for dynamic apps)
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response for future offline use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch((error) => {
        console.log("Fetch failed, trying cache:", event.request.url);
        // If network fails, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Return a basic offline page for navigation requests
          if (event.request.mode === "navigate") {
            return new Response(
              '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>App is offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Retry</button></body></html>',
              {
                status: 200,
                headers: { "Content-Type": "text/html" },
              }
            );
          }
          throw error;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...", CACHE_NAME);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all caches that don't match current version
            if (cacheName.startsWith("zapygo-") && cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Push notification handling
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New update available",
    icon: "/manifest-icon-192.png",
    badge: "/manifest-icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "View Order",
        icon: "/manifest-icon-192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/manifest-icon-192.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Zapygo", options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});
