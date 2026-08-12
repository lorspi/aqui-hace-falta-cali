import React, { useState } from 'react';
import { Phone, ShieldAlert, Info, X } from 'lucide-react';

interface BannerDisclaimerProps {
  hasDemoData: boolean;
  onResetDemoData?: () => void;
}

export const BannerDisclaimer: React.FC<BannerDisclaimerProps> = ({
  hasDemoData,
  onResetDemoData,
}) => {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="bg-slate-100 border-b border-slate-200">
      {/* Official emergency notice */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900">Aviso importante:</strong> Esta plataforma es una capa ciudadana de ayuda y{' '}
            <strong className="text-amber-900">no sustituye los canales oficiales de emergencia</strong>.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-800 font-medium">
          <span className="text-slate-500 hidden md:inline">Líneas de emergencia:</span>
          <a
            href="tel:123"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            <Phone className="w-3 h-3 text-red-600" /> 123
          </a>
          <a
            href="tel:132"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            Cruz Roja 132
          </a>
          <a
            href="tel:119"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            Bomberos 119
          </a>
        </div>
      </div>

      {/* Demo data alert banner */}
      {hasDemoData && !dismissed && (
        <div className="bg-amber-50 border-t border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                <strong>DATOS DE DEMOSTRACIÓN:</strong> Se están mostrando puntos de prueba simulados para Cali para evaluar el flujo de la plataforma.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onResetDemoData && (
                <button
                  onClick={onResetDemoData}
                  className="underline text-amber-950 font-semibold hover:text-black text-[11px]"
                >
                  Restablecer datos demo
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="p-0.5 text-amber-800 hover:text-amber-950 rounded"
                title="Cerrar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
