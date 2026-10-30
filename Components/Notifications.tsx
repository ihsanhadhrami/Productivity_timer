import React, { useCallback, useEffect, useState } from 'react';
import { X, PartyPopper, Coffee, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * In-app toasts plus system (browser) notifications.
 *
 * Usage:
 *   const notifications = useNotifications();
 *   notifications.notify('success', 'Saved', 'All done.');
 *   notifications.notify('focus-complete', 'Done!', 'Take a break.', { whenHidden: { title, body } });
 *   <ToastStack {...notifications} />
 *
 * notify() always shows a toast and, when permission is granted, a system
 * notification. Pass `whenHidden` to also send a sticky system notification
 * if the user is in another tab or app.
 */

export type ToastType = 'focus-complete' | 'break-complete' | 'info' | 'success' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface NotifyOptions {
  // Only shown as a system notification if the page is hidden when notify() is called
  whenHidden?: { title: string; body: string };
  // Whether the in-app toast also gets a system notification (default true)
  system?: boolean;
}

const TOAST_DURATION_MS = 5000;

const TOAST_STYLES: Record<ToastType, { background: string; glow: string; icon: React.ReactNode }> = {
  'focus-complete': {
    background: 'bg-gradient-to-r from-emerald-500/90 via-green-500/90 to-teal-500/90',
    glow: 'bg-emerald-400',
    icon: <PartyPopper className="w-6 h-6" />,
  },
  'break-complete': {
    background: 'bg-gradient-to-r from-violet-500/90 via-purple-500/90 to-fuchsia-500/90',
    glow: 'bg-violet-400',
    icon: <Zap className="w-6 h-6" />,
  },
  success: {
    background: 'bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-indigo-500/90',
    glow: 'bg-cyan-400',
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
  warning: {
    background: 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-red-500/90',
    glow: 'bg-amber-400',
    icon: <AlertTriangle className="w-6 h-6" />,
  },
  info: {
    background: 'bg-gradient-to-r from-blue-500/90 via-cyan-500/90 to-teal-500/90',
    glow: 'bg-blue-400',
    icon: <Coffee className="w-6 h-6" />,
  },
};

const canNotify = () => typeof Notification !== 'undefined' && Notification.permission === 'granted';

const sendSystemNotification = (title: string, options: NotificationOptions) => {
  if (!canNotify()) {
    console.log('🔕 Notifications not available or not permitted');
    return;
  }
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.warn('❌ Failed to send browser notification:', e);
  }
};

export function useNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasPermission, setHasPermission] = useState(canNotify);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        setHasPermission(permission === 'granted');
        console.log(permission === 'granted' ? '✅ Notification permission granted' : '❌ Notification permission denied');
      });
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const notify = useCallback((type: ToastType, title: string, message: string, options: NotifyOptions = {}) => {
    const toast: Toast = { id: Date.now().toString(), type, title, message };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS);

    if (options.system !== false) {
      sendSystemNotification(title, { body: message, icon: '/favicon.svg', tag: 'timer-notification' });
    }

    if (options.whenHidden && document.hidden) {
      sendSystemNotification(options.whenHidden.title, {
        body: options.whenHidden.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'timer-complete',
        requireInteraction: true, // Keep notification visible for urgent alerts
        silent: false,
      });
    }
  }, [dismiss]);

  return { toasts, dismiss, notify, hasPermission };
}

interface ToastStackProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, dismiss }) => (
  <>
    <div className="fixed left-4 right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {toasts.map((toast, index) => {
        const style = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in w-full md:w-auto flex justify-end"
            style={{
              animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className={`relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl w-full md:w-auto md:min-w-[320px] max-w-[400px] ${style.background}`}>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

              {/* Glow effect */}
              <div className={`absolute -inset-1 blur-xl opacity-50 ${style.glow}`} />

              <div className="relative p-4 flex items-start gap-4">
                {/* Icon with pulse */}
                <div className={`flex-shrink-0 p-3 rounded-xl bg-white/20 backdrop-blur-sm ${
                  toast.type === 'focus-complete' ? 'animate-bounce-soft' : 'animate-pulse-soft'
                }`}>
                  <div className="text-white drop-shadow-lg">
                    {style.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-white font-bold text-lg tracking-tight drop-shadow-sm">
                    {toast.title}
                  </h4>
                  <p className="text-white/90 text-sm mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => dismiss(toast.id)}
                  className="flex-shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 group"
                >
                  <X className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-black/10">
                <div
                  className="h-full bg-white/40 animate-progress"
                  style={{ animation: `progress ${TOAST_DURATION_MS}ms linear forwards` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Toast Animation Styles */}
    <style>{`
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%) scale(0.8); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
      }
      @keyframes bounce-soft {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes pulse-soft {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      .animate-bounce-soft { animation: bounce-soft 1s ease-in-out infinite; }
      .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
    `}</style>
  </>
);
