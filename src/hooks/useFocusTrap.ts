import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Hook de accesibilidad para atrapar el foco dentro de un contenedor modal (Focus Trap).
 * - Evita que el foco salga al tabular (Tab / Shift+Tab).
 * - Cierra con tecla Escape si se proporciona `onEscape`.
 * - Devuelve el foco al elemento de origen (trigger) al cerrarse el modal.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>,
  options: UseFocusTrapOptions
) {
  const { isActive, onEscape, initialFocusRef } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const wasActiveRef = useRef(false);

  // Mantener referencias actualizadas de callbacks y refs sin re-disparar efectos
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const initialFocusRefRef = useRef(initialFocusRef);
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!isActive) {
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
          previousActiveElement.current = null;
        }
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let timerId: ReturnType<typeof setTimeout> | undefined;

    // Solo al abrir el modal (transición de inactivo a activo)
    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      previousActiveElement.current = document.activeElement as HTMLElement | null;

      // Solo dar foco inicial si el foco actual no está ya dentro del contenedor
      if (!container.contains(document.activeElement)) {
        timerId = setTimeout(() => {
          if (container.contains(document.activeElement)) return;

          if (initialFocusRefRef.current?.current) {
            initialFocusRefRef.current.current.focus();
          } else {
            const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (focusables.length > 0) {
              focusables[0].focus();
            } else {
              container.focus();
            }
          }
        }, 50);
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscapeRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, containerRef]);

  // Al desmontar el componente si aún estaba activo, restaurar foco previo
  useEffect(() => {
    return () => {
      if (wasActiveRef.current && previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, []);
}
