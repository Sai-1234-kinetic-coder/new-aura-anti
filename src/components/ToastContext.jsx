import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = useCallback((message, type, duration) => {
    addToast(message, type, duration);
  }, [addToast]);

  toast.success = (msg, duration) => addToast(msg, 'success', duration);
  toast.error = (msg, duration) => addToast(msg, 'error', duration);
  toast.warning = (msg, duration) => addToast(msg, 'warning', duration);
  toast.info = (msg, duration) => addToast(msg, 'info', duration);

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
