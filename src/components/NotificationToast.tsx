import React, { Component, lazy, Suspense } from 'react';
import successCheckAnimation from '../assets/lottie/success-check.json';

export type NotificationTone = 'success' | 'error' | 'info' | 'warning';
export type NotificationPhase = 'enter' | 'exit';

export interface NotificationToastData {
  id?: number;
  message: string;
  type: NotificationTone;
  phase?: NotificationPhase;
  title?: string;
  icon?: string;
}

interface NotificationToastProps {
  notification: NotificationToastData | null;
  className?: string;
}

interface MotionBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface MotionBoundaryState {
  hasError: boolean;
}

const Lottie = lazy(() => import('lottie-react'));

class MotionBoundary extends Component<MotionBoundaryProps, MotionBoundaryState> {
  state: MotionBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MotionBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;

    return this.props.children;
  }
}

const toneStyles: Record<NotificationTone, string> = {
  success: 'bg-emerald-500 text-white shadow-emerald-500/20',
  error: 'bg-red-500 text-white shadow-red-500/20',
  info: 'bg-slate-900 text-white shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-900 dark:shadow-slate-100/10',
  warning: 'bg-amber-500 text-white shadow-amber-500/20',
};

const toneIcons: Record<NotificationTone, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const successMotionFallback = (
  <span className="toast-success-check" aria-hidden="true">
    <span className="toast-success-check__mark" />
  </span>
);

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, className = '' }) => {
  if (!notification) return null;

  const phaseClass = `toast-${notification.phase ?? 'enter'}`;
  const icon = notification.icon || toneIcons[notification.type];
  const showSuccessMotion = notification.type === 'success' && !notification.icon;

  return (
    <div className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 ${className}`.trim()}>
      <div className={`${phaseClass} flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl ${toneStyles[notification.type]}`}>
        {showSuccessMotion ? (
          <MotionBoundary fallback={successMotionFallback}>
            <Suspense fallback={successMotionFallback}>
              <Lottie
                aria-hidden="true"
                animationData={successCheckAnimation}
                autoplay
                loop={false}
                className="h-7 w-7 shrink-0"
              />
            </Suspense>
          </MotionBoundary>
        ) : (
          <span className="material-symbols-outlined text-xl">{icon}</span>
        )}
        <div className="min-w-0">
          {notification.title && (
            <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">{notification.title}</p>
          )}
          <p className="text-sm font-semibold tracking-wide">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};
