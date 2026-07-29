import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { AppNotification } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    fetchApi<AppNotification[]>('/notifications').then(setNotifications);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" /> Real-time System Alerts & Notifications
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Stock warnings, sales alerts, purchase confirmations, and system activity logs
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="py-2 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-200 transition-colors"
        >
          Mark All Read
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
        {notifications.map(notif => (
          <div key={notif._id} className="p-4 flex items-start gap-3">
            <div className="mt-0.5">
              {notif.type === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
              {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {notif.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">{notif.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">{new Date(notif.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
