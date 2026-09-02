import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  /**
   * Stable toast API object — built once via useMemo so callers that
   * destructure `toast.success` etc. always get the same reference.
   * The addToastRef ensures the shorthand methods always call the
   * latest `addToast` without needing to re-create the API object.
   */
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  const toast = useMemo(() => {
    const fn = (message, type, duration) => addToastRef.current(message, type, duration);
    fn.success = (msg, duration) => addToastRef.current(msg, 'success', duration);
    fn.error   = (msg, duration) => addToastRef.current(msg, 'error',   duration);
    fn.warning = (msg, duration) => addToastRef.current(msg, 'warning', duration);
    fn.info    = (msg, duration) => addToastRef.current(msg, 'info',    duration);
    return fn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally stable — ref pattern handles freshness

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => {
          let Icon = CheckCircle2;
          let iconColor = '#10b981';

          if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = '#f43f5e';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = '#f59e0b';
          } else if (t.type === 'info') {
            Icon = Info;
            iconColor = '#38bdf8';
          }

          return (
            <div key={t.id} className={`toast-card toast-${t.type}`}>
              <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <div className="toast-message">{t.message}</div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="toast-close-btn"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
