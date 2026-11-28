// Service worker: makes the game installable and keeps the app shell cached.
// Network first (so updates show up right away), falling back to the cache when offline or flaky.
const CACHE='jsr-v55';
const SHELL=['./','./index.html','./online-config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png',
  './characters/rollerblader.glb'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  const sameOrigin=url.origin===location.origin, lib=/cdn\.jsdelivr\.net$/.test(url.hostname);   // three.js / supabase-js modules are pinned versions
  if(!sameOrigin&&!lib) return;                                                                    // never touch Supabase API / realtime traffic
  e.respondWith(fetch(req,sameOrigin?{cache:'no-cache'}:undefined).then(res=>{ if(res.ok&&(sameOrigin||res.type==='cors')){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); } return res; })
    .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
