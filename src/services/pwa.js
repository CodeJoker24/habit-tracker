const updateEvent = 'pwa-update';
let watching = false;

const emitUpdate = () => {
  window.dispatchEvent(new CustomEvent(updateEvent));
};

export const registerPWA = async () => {
  if (!('serviceWorker' in navigator)) return null;

  if (!watching) {
    watching = true;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) emitUpdate();
      });
    });
    return registration;
  } catch {
    return null;
  }
};

export const applyUpdate = async () => {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
};

export const requestBackgroundSync = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) await registration.sync.register('habit-tracker-sync');
  } catch {
    return null;
  }
};
