import { useEffect } from 'react';
import { patientEndpoints } from '../services/api';

export function useNotificationToken() {
  useEffect(() => {
    const registerNotificationToken = async () => {
      if (!('Notification' in window)) return;

      let permission = Notification.permission;

      // Prompt for permission on every visit if denied or default
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        try {
          // Retrieve or generate persistent browser token
          let notificationToken = localStorage.getItem('spm_notification_token');
          
          if (!notificationToken) {
            notificationToken = `spm_${Math.random().toString(36).substring(2)}_${Date.now()}`;
            localStorage.setItem('spm_notification_token', notificationToken);
          }

          // Sends payload { token, platform: 'web' } to /api/notifications/save-token
          await patientEndpoints.saveNotificationToken(notificationToken, 'web');
        } catch (err) {
          console.error("Failed to register notification token:", err);
        }
      }
    };

    registerNotificationToken();
  }, []);
}