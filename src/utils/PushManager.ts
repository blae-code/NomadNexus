import { base44 } from '@/api/base44Client';

// Helper function to convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class PushManager {
  private VAPID_PUBLIC_KEY: string | undefined;

  constructor() {
    // VAPID Public Key should be exposed as an environment variable
    this.VAPID_PUBLIC_KEY = import.meta.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; 
    if (!this.VAPID_PUBLIC_KEY) {
      console.warn("VAPID_PUBLIC_KEY is not set. Push notifications will not function.");
    }
  }

  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return undefined;
      }
    } else {
      console.warn('Service Workers are not supported in this browser.');
      return undefined;
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser.');
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  public async subscribeUserToPush(userId: string): Promise<PushSubscription | undefined> {
    const registration = await this.registerServiceWorker();
    if (!registration || !('pushManager' in registration)) {
      console.error('Push Manager not available.');
      return undefined;
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted. Cannot subscribe.');
      return undefined;
    }

    if (!this.VAPID_PUBLIC_KEY) {
      console.error("Cannot subscribe: VAPID_PUBLIC_KEY is missing.");
      return undefined;
    }

    try {
      const convertedVapidKey = urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('User subscribed to push:', pushSubscription);

      // Send subscription to your backend
      await base44.post('/api/notifications/subscribe', {
        userId,
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pushSubscription.getKey('p256dh')!)))),
          auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pushSubscription.getKey('auth')!)))),
        },
      });
      console.log('Push subscription sent to backend.');
      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe user to push notifications:', error);
      return undefined;
    }
  }
}

export const pushManager = new PushManager();
