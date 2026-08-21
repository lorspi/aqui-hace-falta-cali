import React from 'react';
import { Heart, Truck, Package, Shield, HelpCircle } from 'lucide-react';
import { UserRole } from '../../schemas/registerSchema';

interface Step1RoleProps {
  selectedRole: UserRole | '';
  onSelectRole: (role: UserRole) => void;
  onOpenHelpModal?: () => void;
}

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'voluntario',
    title: 'Voluntario / Donante',
    description: 'Quiero ofrecer ayuda, recursos o donaciones directas a quienes lo necesitan.',
    icon: Heart,
  },
  {
    id: 'rescatista',
    title: 'Rescatista / Operativo',
    description: 'Atención inmediata de emergencias, búsqueda, salvamento y rescate en campo.',
    icon: Truck,
  },
  {
    id: 'acopio',
    title: 'Centro de acopio',
    description: 'Punto físico de recepción, clasificación, almacenamiento y distribución de insumos.',
    icon: Package,
  },
  {
    id: 'entidad_profesional',
    title: 'Entidad / Profesional',
    description: 'Organizaciones civiles, ONG, brigadas especializadas o entidades oficiales.',
    icon: Shield,
  },
];

export const Step1Role: React.FC<Step1RoleProps> = ({
  selectedRole,
  onSelectRole,
  onOpenHelpModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 1 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ¿Cómo quieres participar?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecciona la opción que mejor describa tu rol en la respuesta a la emergencia.
          </p>
        </div>

        {onOpenHelpModal && (
          <button
            type="button"
            onClick={onOpenHelpModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cuál elijo?</span>
          </button>
        )}
      </div>

      {/* Grilla 2x2 de Radio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.id;

          return (
            <div
              key={option.id}
              onClick={() => onSelectRole(option.id)}
              className={`
                relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between space-y-3
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Radio button visual */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {option.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
