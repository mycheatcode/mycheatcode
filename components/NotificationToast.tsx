'use client';

import { useState, useEffect } from 'react';
import {
  NotificationData,
  getUnreadNotifications,
  markNotificationAsRead,
  getNotificationPriorityColor,
  formatNotificationTime
} from '../app/utils/notificationSystem';

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [visibleNotification, setVisibleNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Check for new notifications every 30 seconds
  useEffect(() => {
    const checkNotifications = () => {
      const unreadNotifications = getUnreadNotifications();
      setNotifications(unreadNotifications);

      // Show the highest priority unread notification
      if (unreadNotifications.length > 0 && !visibleNotification) {
        const highestPriority = unreadNotifications.reduce((prev, current) => {
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[current.priority] > priorityOrder[prev.priority] ? current : prev;
        });

        setVisibleNotification(highestPriority);
        setIsVisible(true);

        // Auto-hide after 8 seconds (except for urgent notifications)
        if (highestPriority.priority !== 'urgent') {
          setTimeout(() => {
            handleDismiss();
          }, 8000);
        }
      }
    };

    // Initial check
    checkNotifications();

    // Set up interval
    const interval = setInterval(checkNotifications, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [visibleNotification]);

  const handleDismiss = () => {
    if (visibleNotification) {
      markNotificationAsRead(visibleNotification.id);
      setIsVisible(false);

      // Remove from state after animation
      setTimeout(() => {
        setVisibleNotification(null);
      }, 300);
    }
  };

  const handleAction = () => {
    if (visibleNotification?.actionData) {
      // Handle different action types
      const { section, cheatCodeName, urgent } = visibleNotification.actionData;

      if (section) {
        // Navigate to section or codes page
        localStorage.setItem('selectedCategory', section);
        window.location.href = '/my-codes';
      }
    }

    handleDismiss();
  };

  if (!visibleNotification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div className={`bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-xl backdrop-blur-sm ${
        visibleNotification.priority === 'urgent' ? 'border-red-500/50 bg-red-950/50' :
        visibleNotification.priority === 'high' ? 'border-orange-500/50 bg-orange-950/50' :
        'border-zinc-700'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {visibleNotification.icon && (
              <span className="text-lg">{visibleNotification.icon}</span>
            )}
            <div className="flex flex-col">
              <h4 className="text-white font-semibold text-sm leading-tight">
                {visibleNotification.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${getNotificationPriorityColor(visibleNotification.priority)}`}>
                  {visibleNotification.priority.toUpperCase()}
                </span>
                <span className="text-zinc-500 text-xs">
                  {formatNotificationTime(visibleNotification.timestamp)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-white transition-colors p-1 -m-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Message */}
        <p className="text-zinc-300 text-sm mb-3 leading-relaxed">
          {visibleNotification.message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {visibleNotification.actionLabel && (
              <button
                onClick={handleAction}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  visibleNotification.priority === 'urgent' ?
                    'bg-red-600 hover:bg-red-500 text-white' :
                  visibleNotification.priority === 'high' ?
                    'bg-orange-600 hover:bg-orange-500 text-white' :
                    'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {visibleNotification.actionLabel}
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-medium"
          >
            Dismiss
          </button>
        </div>

        {/* Progress bar for urgent notifications */}
        {visibleNotification.priority === 'urgent' && (
          <div className="mt-3 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Notification count indicator */}
      {notifications.length > 1 && (
        <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {notifications.length}
        </div>
      )}
    </div>
  );
}