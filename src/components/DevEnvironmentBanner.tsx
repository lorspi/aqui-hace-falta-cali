import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export const DevEnvironmentBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isDev = (import.meta.env.VITE_ENV_NAME || import.meta.env.MODE) === 'development';

  if (!isDev || dismissed) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-full shadow-lg text-[11px] font-black border border-amber-400 flex items-center gap-2 animate-bounce-short">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>MODO DESARROLLO (DATOS DE PRUEBA)</span>
      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 hover:bg-amber-600/30 rounded-full transition-colors ml-1"
        title="Ocultar aviso"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
