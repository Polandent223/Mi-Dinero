const CACHE='mi-dinero-redesign-v1';
const ASSETS=['./','./index.html','./styles.css','./dashboard.css','./manifest.webmanifest','./icons/icon.svg','./src/startup-guard.js','./src/app.js','./src/db.js','./src/security.js','./src/sync.js','./src/portfolio.js','./src/wealth-ui.js','./src/dashboard-ui.js','./src/integrity.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(async()=>{
      if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
      return new Response('Recurso no disponible sin conexión.',{status:503,statusText:'Offline',headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }))
  );
});
