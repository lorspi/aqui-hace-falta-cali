import React from 'react';
import { Building, Globe, AlignLeft } from 'lucide-react';

interface StepOrgDetailsProps {
  orgName: string;
  orgDescription?: string;
  orgWebsiteOrSocial?: string;
  errors?: {
    orgName?: string;
    orgDescription?: string;
    orgWebsiteOrSocial?: string;
  };
  onChangeOrgName: (val: string) => void;
  onChangeOrgDescription: (val: string) => void;
  onChangeOrgWebsiteOrSocial: (val: string) => void;
}

export const StepOrgDetails: React.FC<StepOrgDetailsProps> = ({
  orgName,
  orgDescription = '',
  orgWebsiteOrSocial = '',
  errors,
  onChangeOrgName,
  onChangeOrgDescription,
  onChangeOrgWebsiteOrSocial,
}) => {
  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 5 de Organización */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Tu organización
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Proporciona el nombre oficial y los datos clave de tu entidad para que la comunidad pueda identificarlos.
        </p>
      </div>

      <div className="space-y-5">
        {/* Nombre Oficial de la Organización */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre oficial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={orgName}
              onChange={(e) => onChangeOrgName(e.target.value)}
              placeholder="Ej: Cuerpo de Bomberos de Coquimbo"
              className={`
                w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.orgName
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
          </div>
          {errors?.orgName && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.orgName}
            </p>
          )}
        </div>

        {/* ¿Qué hacen? (opcional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            ¿Qué hacen? (opcional)
          </label>
          <div className="relative">
            <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
              <AlignLeft className="w-4 h-4" />
            </div>
            <textarea
              rows={3}
              value={orgDescription}
              onChange={(e) => onChangeOrgDescription(e.target.value)}
              placeholder="En una línea, para que la gente sepa en qué pueden ayudar."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 resize-none"
            />
          </div>
        </div>

        {/* Sitio web o red social (opcional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Sitio web o red social (opcional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={orgWebsiteOrSocial}
              onChange={(e) => onChangeOrgWebsiteOrSocial(e.target.value)}
              placeholder="Ayuda a verificarlos más rápido"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ejemplo: https://bomberos.cl o @bomberoscoquimbo
          </p>
        </div>
      </div>
    </div>
  );
};
