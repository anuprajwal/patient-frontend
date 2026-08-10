import { useEffect } from 'react';
import { patientEndpoints } from '../services/api';

export function useNotificationToken() {
  useEffect(() => {
    const registerNotificationToken = async () => {
      if (!('Notification' in window)) return;

      let permission = Notification.permission;

      // Prompt for permission every visit if denied or default
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        try {
          // Generates a persistent browser SPM notification token token string
          let spmToken = localStorage.getItem('spm_notification_token');
          
          if (!spmToken) {
            spmToken = `spm_${Math.random().toString(36).substring(2)}_${Date.now()}`;
            localStorage.setItem('spm_notification_token', spmToken);
          }

          // Saves SPM token via POST /api/notifications/save-token
          await patientEndpoints.saveNotificationToken(spmToken);
        } catch (err) {
          console.error("Failed to register notification token:", err);
        }
      }
    };

    registerNotificationToken();
  }, []);
}