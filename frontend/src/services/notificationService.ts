import api from './api';
import { ApiResponse } from '../types';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async getVapidPublicKey(): Promise<string> {
    const res = await api.get<ApiResponse<{ publicKey: string }>>('/notifications/vapid-public-key');
    return res.data.data.publicKey;
  },

  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const publicKey = await this.getVapidPublicKey();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
    });

    const jsonSub = subscription.toJSON();
    await api.post('/notifications/subscribe', {
      endpoint: jsonSub.endpoint,
      keys: jsonSub.keys,
    });

    return true;
  },

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      try {
        await api.post('/notifications/unsubscribe', { endpoint });
      } catch (e) {
        console.warn('Failed to notify backend about unsubscribe', e);
      }
      return true;
    }
    return false;
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  async sendTest(): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/notifications/test', {
      title: '🔔 ทดสอบการแจ้งเตือน',
      body: 'ระบบ Web Push Notification ของ Personal Organizer พร้อมใช้งานแล้ว!',
    });
    return res.data.data;
  },

  async checkDue(): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/notifications/check-due');
    return res.data.data;
  },
};
