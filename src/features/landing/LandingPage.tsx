import React, { useState, useEffect } from 'react';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingAccesos } from './components/LandingAccesos';
import { LandingComoFunciona } from './components/LandingComoFunciona';
import { LandingSumarse } from './components/LandingSumarse';
import { LandingSplitPortal } from './components/LandingSplitPortal';
import { LandingFooter } from './components/LandingFooter';
import { ChatbotTicketModal } from '../../components/ChatbotTicketModal';

export const LandingPage: React.FC = () => {
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);

  // Asegurar aislamiento de scroll y fondo continuo idéntico al footer para evitar rebote a espacio en blanco
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const prevBodyOverscroll = document.body.style.overscrollBehaviorY;

    // Bloquear overscroll a nivel de documento para evitar rebote elástico hacia espacio en blanco
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    // Sincronizar el canvas del navegador con el color oscuro del footer (#0f172a)
    document.documentElement.style.backgroundColor = '#0f172a';

    if (isChatbotModalOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;

      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.backgroundColor = prevHtmlBg;
        document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
        document.body.style.overscrollBehaviorY = prevBodyOverscroll;
      };
    }

    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
      document.body.style.overscrollBehaviorY = prevBodyOverscroll;
    };
  }, [isChatbotModalOpen]);

  /* Fondo blanco, no el gris `brand-surface` de antes: las tarjetas de la landing son
     `rd-sunken` (#EEF0F6) y sobre un fondo de #F5F6F9 no se distinguían. En la referencia la
     página es blanca y la tarjeta es el gris tenue (28 de septiembre de 2026). */
  return (
    <div className="font-rd min-h-screen bg-rd-surface text-rd-ink selection:bg-rd-navy selection:text-white">
      {/* Header oficial de navegación */}
      <LandingHeader onOpenChat={() => setIsChatbotModalOpen(true)} />

      <main className="space-y-8 sm:space-y-12">
        {/* ========================================================
            HERO (ABOVE THE FOLD)
            Rehecho el 28 de septiembre de 2026 sobre la referencia de x.ai: una sola
            columna centrada sobre blanco, sin fondo animado. Vive en `LandingHero`.
           ======================================================== */}
        <LandingHero onOpenChat={() => setIsChatbotModalOpen(true)} />


        <LandingAccesos />

        {/* Los tres pasos, cada uno en el bloque de la referencia. Reemplazan a
            `HowItWorksHeroCard`. */}
        <LandingComoFunciona />

        {/* La ventana en vivo de la app se queda: es producto real, no adorno. */}
        <LandingSplitPortal />

        {/* Súmate, con el patrón de tarjetas de la referencia. Reemplaza la sección de
            organizaciones con sus auras y filigranas. */}
        <LandingSumarse onOpenChat={() => setIsChatbotModalOpen(true)} />
      </main>

      {/* Footer oficial */}
      <LandingFooter />

      {/* MODAL DEL CHATBOT EXISTENTE: 100% quirúrgico, sin tocar base de datos */}
      <ChatbotTicketModal
        isOpen={isChatbotModalOpen}
        onClose={() => setIsChatbotModalOpen(false)}
        onGoToMap={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
};
