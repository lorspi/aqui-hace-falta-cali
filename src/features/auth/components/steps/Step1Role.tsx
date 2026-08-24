import React from 'react';
import { User, Shield, Building2 } from 'lucide-react';
import { UserRole } from '../../schemas/registerSchema';

interface Step1RoleProps {
  selectedRole: UserRole | '';
  onSelectRole: (role: UserRole) => void;
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
    title: 'Usuario regular',
    description: 'Puedes ver, crear y editar tus propios reportes',
    icon: User,
  },
  {
    id: 'moderador',
    title: 'Moderador',
    description: 'Ideal para líderes comunitarios con experiencia en verificación.',
    icon: Shield,
  },
  {
    id: 'entidad_profesional',
    title: 'Gobierno / Organización',
    description: 'Para funcionarios de entidades públicas, ONGs o institucionales con correo verificado.',
    icon: Building2,
  },
];

export const Step1Role: React.FC<Step1RoleProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  return (
    <div className="space-y-5 py-2">
      {/* Encabezado del Paso 2 */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ¿Cuál es tu rol?
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Elige el rol que describe tu participación. Obtendrás acceso inmediato como Usuario Regular mientras se procesa tu postulación.
        </p>
      </div>

      {/* Lista Vertical de Tarjetas de Rol (Fidelidad 100% al Mockup) */}
      <div className="space-y-3 pt-2">
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.id;

          return (
            <div
              key={option.id}
              onClick={() => onSelectRole(option.id)}
              className={`
                relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/20 shadow-xs ring-1 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }
              `}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Cuadro contenedor de ícono */}
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                    ${
                      isSelected
                        ? 'bg-blue-100/80 text-blue-700'
                        : 'bg-slate-100/80 text-slate-600'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Texto de título y descripción */}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    {option.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Radio button circular visual */}
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }
                `}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

