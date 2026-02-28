self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});
self.addEventListener('fetch', (e) => {
  // Hanya minimal pass-through agar diakui sebagai PWA oleh browser Android
});
