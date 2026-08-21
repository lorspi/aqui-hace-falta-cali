import React from 'react';
import { User, CreditCard, FileText } from 'lucide-react';
import { DocumentType } from '../../schemas/registerSchema';

interface Step3IdentityProps {
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  errors?: {
    fullName?: string;
    documentNumber?: string;
  };
  onChangeFullName: (val: string) => void;
  onChangeDocumentType: (type: DocumentType) => void;
  onChangeDocumentNumber: (val: string) => void;
}

export const Step3Identity: React.FC<Step3IdentityProps> = ({
  fullName,
  documentType,
  documentNumber,
  errors,
  onChangeFullName,
  onChangeDocumentType,
  onChangeDocumentNumber,
}) => {
  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 3 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ¿Quién eres?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ingresa tus datos personales de identificación para validar y verificar tu perfil.
        </p>
      </div>

      <div className="space-y-5">
        {/* Nombre y Apellido */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre y Apellido
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => onChangeFullName(e.target.value)}
              placeholder="Ej: María Camila Restrepo"
              className={`
                w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.fullName
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
          </div>
          {errors?.fullName && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Tipo de Documento (Toggle / Tabs) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tipo de Documento
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeDocumentType('cedula')}
              className={`
                py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer select-none
                ${
                  documentType === 'cedula'
                    ? 'border-2 border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-xs shadow-blue-500/10'
                    : 'border border-slate-300 bg-white text-slate-600 font-semibold hover:border-slate-400 hover:bg-slate-50'
                }
              `}
            >
              <CreditCard className={`w-4 h-4 ${documentType === 'cedula' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Cédula</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeDocumentType('pasaporte')}
              className={`
                py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer select-none
                ${
                  documentType === 'pasaporte'
                    ? 'border-2 border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-xs shadow-blue-500/10'
                    : 'border border-slate-300 bg-white text-slate-600 font-semibold hover:border-slate-400 hover:bg-slate-50'
                }
              `}
            >
              <FileText className={`w-4 h-4 ${documentType === 'pasaporte' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Pasaporte</span>
            </button>
          </div>
        </div>

        {/* Número de Documento */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Número de Documento
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => onChangeDocumentNumber(e.target.value)}
              placeholder="Ej: 1023456789"
              className={`
                w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.documentNumber
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
          </div>
          {errors?.documentNumber && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.documentNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
