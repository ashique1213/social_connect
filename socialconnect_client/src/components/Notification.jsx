
// src/components/Notification.jsx
function Notification({ notification }) {
  return (
    <div className={`p-4 rounded-lg border mb-3 transition-all duration-200 ${
      notification.is_read 
        ? 'bg-white border-gray-200' 
        : 'bg-gray-50 border-gray-300 shadow-sm'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${
          notification.is_read ? 'bg-gray-300' : 'bg-gray-900'
        }`}></div>
        
        <div className="flex-1">
          <p className={`text-sm leading-relaxed ${
            notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
          }`}>
            {notification.message}
          </p>
          <span className="text-xs text-gray-500 mt-1 block">
            {new Date(notification.created_at).toLocaleString()}
          </span>
        </div>
        
        {!notification.is_read && (
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">
              New
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification;
