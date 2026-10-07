import React, { useState, useEffect } from 'react';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingAccesos } from './components/LandingAccesos';
import { LandingComoFunciona } from './components/LandingComoFunciona';
import { LandingSumarse } from './components/LandingSumarse';
import { LandingSplitPortal } from './components/LandingSplitPortal';
import { LandingFooter } from './components/LandingFooter';
import { Grilla12 } from './components/Grilla12';
import { ChatbotTicketModal } from '../../components/ChatbotTicketModal';
import { useTemaLanding } from './useTemaLanding';

export const LandingPage: React.FC = () => {
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);
  /* Oscuro o claro (ver `useTemaLanding`): lo cambia la configuración del header. */
  const [tema, setTema] = useTemaLanding();

  // Asegurar aislamiento de scroll y fondo continuo idéntico al footer para evitar rebote a espacio en blanco
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const prevBodyOverscroll = document.body.style.overscrollBehaviorY;

    // Bloquear overscroll a nivel de documento para evitar rebote elástico hacia espacio en blanco
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    // El lienzo del navegador toma el fondo de la landing (rd-noche) para que el rebote del
    // scroll no muestre otro color. Se lee del token en vez de escribir el hex aquí, y se vuelve a
    // leer al cambiar de modo: en claro el token vale la crema.
    document.documentElement.style.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-rd-noche')
      .trim();

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
  }, [isChatbotModalOpen, tema]);

  /* La landing va en oscuro: fondo negro y letra blanca (Alejandro, 6 de octubre de 2026: «fondo
     negro 1E1E1E, letra blanca», y esa noche «Pon el fondo completamente negro. 000000»), en Noto
     Sans por la clase rd-landing. Antes iba en crema, con la tinta oscura de la herramienta. El
     fondo lleva el grano (`rd-grano`; Alejandro, 6 de octubre de 2026: «una textura como granular
     a todo»), y con él el hero y el panel de la sección 2, que no tienen fondo propio. */
  return (
    <div className="rd-landing rd-grano font-rd min-h-screen bg-rd-noche text-rd-noche-tinta selection:bg-rd-ayuda selection:text-rd-noche">
      {/* El header solo lleva el logo y el idioma: las dos acciones viven en el hero. */}
      <LandingHeader tema={tema} alCambiarTema={setTema} />

      <main className="space-y-8 sm:space-y-12">
        <LandingHero onOpenChat={() => setIsChatbotModalOpen(true)} />

        <LandingAccesos />

        {/* Los tres pasos, cada uno en el bloque de la referencia. Reemplazaron a la tarjeta
            de pasos del equipo, que se borró el 6 de octubre de 2026 con las demás piezas sin
            uso (Alejandro: «borre lo que ya no se usa»). */}
        <LandingComoFunciona />

        {/* La ventana en vivo de la app se queda: es producto real, no adorno. */}
        <LandingSplitPortal />

        {/* Súmate, con el patrón de tarjetas de la referencia. Reemplaza la sección de
            organizaciones con sus auras y filigranas. */}
        <LandingSumarse onOpenChat={() => setIsChatbotModalOpen(true)} />
      </main>

      {/* Footer oficial */}
      <LandingFooter />

      {/* La grilla de revisión, solo en `npm run dev` (Alejandro, 6 de octubre de 2026: «Si, solo
          en desarrollo como en sandbox»). Con `import.meta.env.DEV` falso la build la deja fuera
          entera, componente y escucha de la tecla incluidos: la landing pública no la lleva.
          Apagada por defecto, se prende con G. */}
      {import.meta.env.DEV && <Grilla12 />}

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
