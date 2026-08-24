import React from 'react';
import { User, CreditCard, FileText } from 'lucide-react';
import { DocumentType, UserRole } from '../../schemas/registerSchema';

interface Step3IdentityProps {
  role?: UserRole;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  documentType: DocumentType;
  documentNumber: string;
  errors?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    documentNumber?: string;
  };
  onChangeFullName?: (val: string) => void;
  onChangeFirstName?: (val: string) => void;
  onChangeLastName?: (val: string) => void;
  onChangeDocumentType: (type: DocumentType) => void;
  onChangeDocumentNumber: (val: string) => void;
}

export const Step3Identity: React.FC<Step3IdentityProps> = ({
  role,
  fullName = '',
  firstName = '',
  lastName = '',
  documentType,
  documentNumber,
  errors,
  onChangeFullName,
  onChangeFirstName,
  onChangeLastName,
  onChangeDocumentType,
  onChangeDocumentNumber,
}) => {
  const getRoleBadge = (r?: UserRole) => {
    switch (r) {
      case 'rescatista':
        return { label: 'Rescatista / Operativo', icon: '🚚', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'acopio':
        return { label: 'Centro de Acopio', icon: '📦', color: 'bg-purple-50 text-purple-900 border-purple-200' };
      case 'entidad_profesional':
        return { label: 'Entidad / Profesional', icon: '🛡️', color: 'bg-slate-100 text-slate-900 border-slate-300' };
      case 'voluntario':
      default:
        return { label: 'Voluntario / Donante', icon: '❤️', color: 'bg-blue-50 text-blue-900 border-blue-200' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 3 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ¿Quién eres?
          </h2>
          {role && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Ingresa tus datos personales de identificación para validar y verificar tu perfil.
        </p>
      </div>

      <div className="space-y-5">
        {/* Nombres y Apellidos */}
        {onChangeFirstName && onChangeLastName ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombres <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => onChangeFirstName(e.target.value)}
                  placeholder="Ej: María Camila"
                  className={`
                    w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                    ${
                      errors?.firstName
                        ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                        : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                    }
                  `}
                />
              </div>
              {errors?.firstName && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Apellidos <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => onChangeLastName(e.target.value)}
                  placeholder="Ej: García López"
                  className={`
                    w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                    ${
                      errors?.lastName
                        ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                        : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                    }
                  `}
                />
              </div>
              {errors?.lastName && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
        ) : (
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
                onChange={(e) => onChangeFullName && onChangeFullName(e.target.value)}
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
        )}

        {/* Tipo de Documento */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tipo de Documento
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <select
              value={documentType}
              onChange={(e) => onChangeDocumentType(e.target.value as DocumentType)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer shadow-xs"
            >
              <option value="cedula">Cédula de Ciudadanía (CC)</option>
              <option value="cedula_extranjeria">Cédula de Extranjería (CE)</option>
              <option value="pasaporte">Pasaporte (PA)</option>
              <option value="ppt_pep">Permiso por Protección Temporal (PPT / PEP)</option>
              <option value="nit">NIT (Identificación Tributaria)</option>
              <option value="tarjeta_identidad">Tarjeta de Identidad (TI)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
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
