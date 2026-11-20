try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyBeG0oZtYUQ6JUgXnCcpWTeGt1I-dDXiV0",
    authDomain: "popais-food.firebaseapp.com",
    projectId: "popais-food",
    storageBucket: "popais-food.firebasestorage.app",
    messagingSenderId: "836484126971",
    appId: "1:836484126971:web:c317306b91b632f78bf85e"
  });
  // Mensagens só com "data": o próprio app monta e mostra a notificação.
  firebase.messaging().onBackgroundMessage(p => {
    const d = p.data || {};
    return self.registration.showNotification(d.title || 'Popais Food', {
      body: d.body || '', icon: 'ic_launcher.png', badge: 'ic_launcher.png',
      tag: d.tag || undefined, data: { url: d.url || './' }
    });
  });
} catch (e) { /* sem internet na instalação: o push volta a funcionar na próxima atualização */ }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});

const CACHE = 'popais-cliente-v2';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'logo.png', 'ic_launcher.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sempre tenta a rede primeiro (para o cliente ver a versão mais nova); usa o cache só se estiver sem internet.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
