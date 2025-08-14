import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Notification from '../components/Notification';
import { markNotificationRead, markAllNotificationsRead } from '../services/api';
import { toast } from 'react-toastify';

function Notifications() {
  const { notifications, setNotifications, fetchNotifications, loading } = useContext(AuthContext);

  useEffect(() => {
    // Refresh notifications when component mounts
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      toast.success('Notification marked as read.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to mark notification as read.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all notifications as read.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 capitalize">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white">
                    {unreadCount} unread
                  </span>
                  <button
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                  >
                    Mark All Read
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM15 7V2l5 5h-5zM9 7V2L4 7h5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  You'll see notifications here when someone likes your posts, follows you, or comments on your content.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                    className={`cursor-pointer transition-all duration-200 ${
                      notification.is_read ? 'opacity-75' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <Notification notification={notification} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="text-center">
                <button 
                  onClick={fetchNotifications}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;