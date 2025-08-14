// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export const subscribeToNotifications = (userId, callback) => {
  console.log('Subscribing to notifications for user:', userId);
  
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications_notification', // Django table name
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification received:', payload.new);
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications_notification',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification updated:', payload.new);
        callback(payload.new, 'UPDATE');
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  return channel;
};

export const unsubscribeFromNotifications = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

export default supabase;