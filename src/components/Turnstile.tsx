import React, { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  /** 
   * 'always' = widget siempre visible (default)
   * 'interaction-only' = invisible hasta que sea necesario (challenge)
   * 'execute' = totalmente invisible, se ejecuta programáticamente
   */
  appearance?: 'always' | 'interaction-only' | 'execute';
  size?: 'normal' | 'compact' | 'flexible';
  theme?: 'light' | 'dark' | 'auto';
  /** Language for the widget (e.g. 'es', 'en') */
  language?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (container: HTMLElement | string, options?: any) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export const Turnstile: React.FC<TurnstileProps> = React.memo(({
  onVerify,
  onError,
  onExpire,
  appearance = 'always',
  size = 'normal',
  theme = 'light',
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  // Keep refs updated without causing re-renders
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // Already rendered

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => {
          onVerifyRef.current(token);
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
        theme,
        size,
        appearance,
        language: language || 'es',
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []); // Empty deps — only mount/unmount

  return <div ref={containerRef} className="flex justify-center" />;
});

Turnstile.displayName = 'Turnstile';
