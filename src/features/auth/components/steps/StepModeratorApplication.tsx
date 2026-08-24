import React from 'react';

interface StepModeratorApplicationProps {
  moderatorCommunityCollective?: string;
  moderatorMotivation?: string;
  isSubmitting?: boolean;
  errors?: {
    moderatorCommunityCollective?: string;
    moderatorMotivation?: string;
  };
  onChangeCommunityCollective: (val: string) => void;
  onChangeMotivation: (val: string) => void;
}

export const StepModeratorApplication: React.FC<StepModeratorApplicationProps> = ({
  moderatorCommunityCollective = '',
  moderatorMotivation = '',
  isSubmitting = false,
  errors,
  onChangeCommunityCollective,
  onChangeMotivation,
}) => {
  return (
    <div className="space-y-6 py-2">
      {/* Encabezado del Paso de Moderador */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Postulación como Moderador
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Cuéntanos sobre tu experiencia. Tu postulación será revisada por el equipo.
        </p>
      </div>

      <div className="space-y-5 pt-1">
        {/* Campo 1: Colectivo / Organización comunitaria */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Colectivo / Organización comunitaria
          </label>
          <input
            type="text"
            value={moderatorCommunityCollective}
            onChange={(e) => onChangeCommunityCollective(e.target.value)}
            placeholder="Ej: Junta de Acción Comunal Barrio X"
            disabled={isSubmitting}
            className={`
              w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
              ${
                errors?.moderatorCommunityCollective
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
              }
            `}
          />
          {errors?.moderatorCommunityCollective && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.moderatorCommunityCollective}
            </p>
          )}
        </div>

        {/* Campo 2: Motivación o experiencia para moderar */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Motivación o experiencia para moderar <span className="text-blue-600">*</span>
          </label>
          <textarea
            rows={4}
            value={moderatorMotivation}
            onChange={(e) => onChangeMotivation(e.target.value)}
            placeholder="Describe tu experiencia en la comunidad y por qué quieres ser moderador..."
            disabled={isSubmitting}
            className={`
              w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none resize-none
              ${
                errors?.moderatorMotivation
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
              }
            `}
          />
          {errors?.moderatorMotivation && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.moderatorMotivation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
