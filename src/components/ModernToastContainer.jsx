import React, { useState, useEffect, useRef } from 'react';
import { toast } from '../utils/toast';

export default function ModernToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());

  useEffect(() => {
    const unsub = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      const timerId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        timersRef.current.delete(timerId);
      }, newToast.duration || 4000);

      timersRef.current.add(timerId);
    });

    return () => {
      unsub();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-circle-check';
      case 'error':
        return 'fa-circle-xmark';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'info':
      default:
        return 'fa-circle-info';
    }
  };

  const getToastColors = (type) => {
    switch (type) {
      case 'success':
        return {
          border: 'var(--brand-emerald, #10b981)',
          iconColor: '#10b981',
          glow: 'rgba(16, 185, 129, 0.22)',
          bar: '#10b981'
        };
      case 'error':
        return {
          border: '#ef4444',
          iconColor: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.22)',
          bar: '#ef4444'
        };
      case 'warning':
        return {
          border: 'var(--brand-gold, #f59e0b)',
          iconColor: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.22)',
          bar: '#f59e0b'
        };
      case 'info':
      default:
        return {
          border: 'var(--brand-navy, #0f172a)',
          iconColor: '#0f172a',
          glow: 'rgba(15, 23, 42, 0.2)',
          bar: '#0f172a'
        };
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          maxWidth: '400px',
          width: 'calc(100vw - 48px)'
        }}
      >
        {toasts.map((t) => {
          const colors = getToastColors(t.type);
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '12px',
                padding: '14px 18px',
                borderLeft: `5px solid ${colors.border}`,
                boxShadow: `0 12px 30px rgba(0, 0, 0, 0.14), 0 0 16px ${colors.glow}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(226, 232, 240, 0.85)'
              }}
            >
              <div
                style={{
                  fontSize: '1.35rem',
                  color: colors.iconColor,
                  lineHeight: 1,
                  marginTop: '2px',
                  flexShrink: 0
                }}
              >
                <i className={`fa-solid ${getToastIcon(t.type)}`}></i>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <h4
                    style={{
                      margin: '0 0 3px 0',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: 'var(--brand-navy, #0f172a)',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    {t.title}
                  </h4>
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    color: '#475569',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}
                >
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  padding: '2px',
                  lineHeight: 1,
                  flexShrink: 0,
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Progress bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  background: colors.bar,
                  width: '100%',
                  animation: `progressBar ${t.duration || 4000}ms linear forwards`
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
}
