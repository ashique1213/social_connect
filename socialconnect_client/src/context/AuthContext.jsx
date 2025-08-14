// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { login, getProfile, getNotifications, logout } from '../services/api';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../services/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationChannel, setNotificationChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing notifications from Django API
  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleRealtimeNotification = (newNotification, eventType = 'INSERT') => {
    if (eventType === 'UPDATE') {
      // Update existing notification
      setNotifications(prev => 
        prev.map(n => n.id === newNotification.id ? newNotification : n)
      );
    } else {
      // Add new notification at the beginning
      setNotifications(prev => [newNotification, ...prev]);
      
      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Notification', {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const setupRealtimeSubscription = (userId) => {
    const channel = subscribeToNotifications(userId, handleRealtimeNotification);
    setNotificationChannel(channel);
    return channel;
  };

  const loginUser = async (credentials) => {
    try {
      const response = await login(credentials);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.user);
      
      // Fetch existing notifications and setup real-time subscription
      if (response.data.user.id) {
        await fetchNotifications();
        setupRealtimeSubscription(response.data.user.id);
        
        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
      
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  };

  const logoutUser = async () => {
    try {
      await logout({ refresh: localStorage.getItem('refresh_token') });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    
    // Cleanup
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setNotifications([]);
    
    if (notificationChannel) {
      unsubscribeFromNotifications(notificationChannel);
      setNotificationChannel(null);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (localStorage.getItem('access_token')) {
        try {
          const response = await getProfile();
          setUser(response.data);
          
          // Fetch notifications and setup real-time subscription
          await fetchNotifications();
          setupRealtimeSubscription(response.data.id);
          
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          logoutUser();
        }
      }
      setLoading(false);
    };
    
    fetchUser();
    
    // Cleanup on unmount
    return () => {
      if (notificationChannel) {
        unsubscribeFromNotifications(notificationChannel);
      }
    };
  }, []);

  const value = {
    user,
    setUser,
    loginUser,
    logoutUser,
    notifications,
    setNotifications,
    fetchNotifications,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};