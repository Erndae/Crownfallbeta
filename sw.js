// Crownfall BETA · Army Limits offline cache (scope: /beta/). Only ever touches its own beta caches.
const VERSION = 'crownfall-beta-army-limits-1';
const FILES = ['./', './index.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(FILES.map(f => c.add(f)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('crownfall-beta-army-limits-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin || !url.pathname.includes('/beta/')) return;   // the live site's files are left to the live site
  const keep = r => { if(r && r.ok){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; };
  e.respondWith(fetch(e.request).then(keep).catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
