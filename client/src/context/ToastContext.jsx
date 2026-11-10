import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

    // Auto dismiss after 3.8s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose global window helper and gracefully intercept window.alert so no browser popups appear
  useEffect(() => {
    window.showToast = (message, type = 'info', title = '') => {
      addToast(message, type, title);
    };

    // Polyfill window.alert to render our custom card popup
    const originalAlert = window.alert;
    window.alert = (message) => {
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
      const isErr = msgStr.toLowerCase().includes('fail') || msgStr.toLowerCase().includes('error') || msgStr.toLowerCase().includes('cannot');
      const isSuccess = msgStr.toLowerCase().includes('success') || msgStr.toLowerCase().includes('saved') || msgStr.toLowerCase().includes('logged');
      addToast(msgStr, isErr ? 'error' : isSuccess ? 'success' : 'info');
    };

    return () => {
      delete window.showToast;
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-4 fade-in ${
                isSuccess
                  ? 'bg-slate-950/95 border-emerald-500/50 text-white shadow-emerald-500/10'
                  : isError
                  ? 'bg-slate-950/95 border-rose-500/50 text-white shadow-rose-500/10'
                  : isWarning
                  ? 'bg-slate-950/95 border-amber-500/50 text-white shadow-amber-500/10'
                  : 'bg-slate-950/95 border-slate-700 text-white shadow-slate-900/40'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 text-left min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs font-semibold text-slate-300 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
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
    return {
      showToast: (msg, type = 'info', title = '') => {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(msg, type, title);
        } else {
          console.log(`[Toast ${type}]: ${msg}`);
        }
      }
    };
  }
  return context;
}
