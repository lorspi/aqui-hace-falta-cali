import React from 'react';
import { getOfficialWhatsappLink } from '../../../constants/contact';

/**
 * Botón flotante de WhatsApp oficial exclusivo de la landing page.
 *
 * Estética RaDAR con trazo a mano alzada:
 * - Color en estado pasivo: Verde pastel suave (#86EFAC) con borde translúcido a tono.
 * - En hover: Iluminación al verde oficial vibrante (#25D366) y sutil anillo expansivo.
 * - Glifo de WhatsApp: Burbuja dibujada en trazo continuo (`.rd-trazo-continuo`)
 *   y auricular telefónico canónico perfectamente centrado y suavizado.
 */
export const BotonWhatsappFlotante: React.FC = () => {
  const whatsappUrl = getOfficialWhatsappLink('Hola raDAR, quisiera ponerme en contacto con el equipo.');

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-3 group">
      {/* Etiqueta flotante informativa en hover (solo escritorio) */}
      <span
        aria-hidden="true"
        className="font-rd pointer-events-none hidden sm:inline-block -translate-x-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 rounded-full border border-emerald-500/25 bg-rd-noche-2/95 px-3.5 py-1.5 text-rd-13 font-medium text-rd-noche-tinta shadow-xl backdrop-blur-md whitespace-nowrap"
      >
        ¿En qué podemos ayudarte? Escríbenos
      </span>

      {/* Botón circular flotante */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar al equipo por WhatsApp"
        className="relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-rd-noche-2/95 text-[#86EFAC] shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#25D366] hover:text-[#25D366] hover:shadow-[0_0_24px_rgba(37,211,102,0.3)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        {/* Anillo de pulso sutil al interactuar */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-emerald-400/30 opacity-0 group-hover:opacity-100 group-hover:scale-120 transition-all duration-500"
        />

        {/* Glifo de WhatsApp */}
        <svg
          viewBox="0 0 256 256"
          className="h-7 w-7 sm:h-8 sm:w-8 overflow-visible transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Burbuja exterior con trazo a mano alzada */}
          <path
            d="M 128 34 C 178 34, 218 74, 218 124 C 218 174, 178 214, 128 214 C 111 214, 94 209, 80 200 L 42 212 C 37.8 213.4, 33.6 209.2, 35 205 L 47 167 C 38 153, 33 138, 33 124 C 33 74, 74 34, 128 34 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            className="rd-trazo-continuo"
          />

          {/* Teléfono interior icónico perfectamente proporcionado y centrado */}
          <path
            d="M 152 176 A 72.08 72.08 0 0 1 80 104 A 24 24 0 0 1 99.29 80.46 L 110.77 103.46 L 101 118 A 8 8 0 0 0 100.27 125.51 A 56.47 56.47 0 0 0 130.42 155.66 A 8 8 0 0 0 138 155 L 152.61 145.26 L 175.61 156.74 A 24 24 0 0 1 152 176 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
};
