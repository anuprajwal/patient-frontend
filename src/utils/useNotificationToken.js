import { useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, register, onRegistered } from 'firebase/messaging';

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
    if (!authToken) return;

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

      if (!response.ok) {
        console.warn('Failed to register FCM token with server:', response.status);
      }
    } catch (err) {
      console.error('Error saving notification token:', err);
    }
  };

  const requestAndRegisterMessaging = async () => {
    if (isSyncing.current || !('Notification' in window)) return;
    isSyncing.current = true;

    try {
      let permission = Notification.permission;

      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
        const messaging = getMessaging(app);

        // Register the device instance with your VAPID key
        await register(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
      }
    } catch (error) {
      console.warn('Notification permission or registration failed:', error);
    } finally {
      isSyncing.current = false;
    }
  };

  useEffect(() => {
    // 1. Initialize Firebase and listen for the registered token/FID callback
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    const unsubscribe = onRegistered(messaging, (token) => {
      if (token) {
        saveTokenToBackend(token);
      }
    });

    // 2. Request permission and register on mount
    requestAndRegisterMessaging();

    // 3. Re-prompt when the window regains focus if permission is still pending
    const handleFocus = () => {
      if (Notification.permission !== 'granted') {
        requestAndRegisterMessaging();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
};