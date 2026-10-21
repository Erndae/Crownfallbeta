// Retire the previous Army Limits beta cache; leave all other apps untouched.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('crownfall-beta-army-limits-')).map(name => caches.delete(name)));
  await self.clients.claim();
  await self.registration.unregister();
})()));
