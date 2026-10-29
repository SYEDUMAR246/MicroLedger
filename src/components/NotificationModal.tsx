import React from 'react';
import { X, Bell, CheckCheck, Wallet, Sparkles, ShoppingBag } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationModalProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  onClose,
}) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'budget':
        return <Wallet className="w-4 h-4 text-purple-600" />;
      case 'tip':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-400">Activity & budget alerts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No notifications yet. You're all caught up!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 p-2.5 rounded-2xl transition-colors ${
                  n.read ? 'bg-transparent' : 'bg-orange-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
