import { useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const getAuthToken = () => {
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? match[2] : null;
};

export const useNotificationToken = () => {
  const isSyncing = useRef(false);

  const saveTokenToBackend = async (token) => {
    const authToken = getAuthToken();
    if (!authToken) {
      console.warn('[FCM] No auth_token found in cookie.');
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.docapp.co.in';
      const response = await fetch(`${baseUrl}/api/notifications/save-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          platform: 'web',
        }),
      });

      console.log('[FCM] Backend save response:', response.status);
    } catch (err) {
      console.error('[FCM] Error saving token to backend:', err);
    }
  };

  const requestAndSaveToken = async () => {
    if (isSyncing.current || !('Notification' in window) || !('serviceWorker' in navigator)) return;
    isSyncing.current = true;

    try {
      let permission = Notification.permission;

      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
        const messaging = getMessaging(app);

        // Explicitly register the service worker from the root public directory
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log('[FCM] Token retrieved successfully:', currentToken);
          await saveTokenToBackend(currentToken);
        }
      }
    } catch (error) {
      console.error('[FCM] Token registration failed:', error);
    } finally {
      isSyncing.current = false;
    }
  };

  useEffect(() => {
    requestAndSaveToken();
  }, []);
};