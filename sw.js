'use strict';
const CACHE_NAME = 'church-live-translator-v4-1-20260614';
const ASSETS = ['./','./index.html?v=4.1','./styles.css?v=4.1','./app.js?v=4.1','./manifest.webmanifest?v=4.1','./icon.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.hostname.includes('mymemory.translated.net')) return; // Always use network for translation fallback.
  event.respondWith(fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); return res;
  }).catch(()=>caches.match(req).then(cached => cached || caches.match('./index.html?v=4.1'))));
});
