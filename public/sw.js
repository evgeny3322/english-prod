const CACHE_NAME = "lexiflow-v1";
const urlsToCache = [
  "/",
  "/welcome",
  "/add",
  "/study",
  "/test",
  "/stats",
];

// Установка Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов (Network First стратегия)
self.addEventListener("fetch", (event) => {
  // Пропускаем запросы, которые не являются GET
  if (event.request.method !== "GET") {
    return;
  }

  // Пропускаем запросы к API и внешним ресурсам
  if (
    event.request.url.includes("/api/") ||
    event.request.url.startsWith("http") && !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем только успешные ответы
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, используем кэш
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Если нет в кэше, возвращаем базовую страницу
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
      })
  );
});

