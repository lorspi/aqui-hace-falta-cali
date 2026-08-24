import React from 'react';
import { useTranslation } from '../../../../i18n/LanguageContext';

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
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-2">
      {/* Encabezado del Paso de Moderador */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('authModeratorTitle')}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {t('authModeratorSubtitle')}
        </p>
      </div>

      <div className="space-y-5 pt-1">
        {/* Campo 1: Colectivo / Organización comunitaria */}
        <div>
          <label className="form-label">
            {t('authModeratorCommunity')}
          </label>
          <input
            type="text"
            value={moderatorCommunityCollective}
            onChange={(e) => onChangeCommunityCollective(e.target.value)}
            placeholder={t('authModeratorCommunityPlaceholder')}
            disabled={isSubmitting}
            className={`input-base ${errors?.moderatorCommunityCollective ? 'input-error' : ''}`}
          />
          {errors?.moderatorCommunityCollective && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.moderatorCommunityCollective}
            </p>
          )}
        </div>

        {/* Campo 2: Motivación o experiencia para moderar */}
        <div>
          <label className="form-label">
            {t('authModeratorMotivation')} <span className="text-blue-600">*</span>
          </label>
          <textarea
            rows={4}
            value={moderatorMotivation}
            onChange={(e) => onChangeMotivation(e.target.value)}
            placeholder={t('authModeratorMotivationPlaceholder')}
            disabled={isSubmitting}
            className={`textarea-base ${errors?.moderatorMotivation ? 'input-error' : ''}`}
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
