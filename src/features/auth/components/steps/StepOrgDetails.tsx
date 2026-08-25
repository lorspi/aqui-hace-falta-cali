import React from 'react';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { OrganizationType } from '../../schemas/registerSchema';
import { ORGANIZATION_TYPE_CONFIG } from '../../../../constants/domainConstants';

interface StepOrgDetailsProps {
  selectedType: OrganizationType;
  orgName: string;
  orgDescription?: string;
  orgWebsiteOrSocial?: string;
  errors?: {
    orgName?: string;
    orgDescription?: string;
    orgWebsiteOrSocial?: string;
  };
  onSelectType: (type: OrganizationType) => void;
  onChangeOrgName: (val: string) => void;
  onChangeOrgDescription: (val: string) => void;
  onChangeOrgWebsiteOrSocial: (val: string) => void;
}

export const StepOrgDetails: React.FC<StepOrgDetailsProps> = ({
  selectedType,
  orgName,
  orgDescription = '',
  orgWebsiteOrSocial = '',
  errors,
  onSelectType,
  onChangeOrgName,
  onChangeOrgDescription,
  onChangeOrgWebsiteOrSocial,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t('authOrgDetailsTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('authOrgDetailsSubtitle')}
        </p>
      </div>

      <div className="space-y-5">
        {/* Tipo o Categoría de Organización */}
        <div>
          <label className="form-label font-bold text-slate-800">
            Tipo de Organización <span className="text-blue-600">*</span>
          </label>
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value as OrganizationType)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
          >
            {Object.values(ORGANIZATION_TYPE_CONFIG).map((org) => (
              <option key={org.id} value={org.id}>
                {org.icon} {org.defaultLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre Oficial de la Organización */}
        <div>
          <label className="form-label">
            {t('authOrgDetailsName')} <span className="text-blue-600">*</span>
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => onChangeOrgName(e.target.value)}
            placeholder={t('authOrgDetailsNamePlaceholder')}
            className={`input-base ${errors?.orgName ? 'input-error' : ''}`}
          />
          {errors?.orgName && (
            <p className="text-xs text-red-600 font-semibold mt-1">{errors.orgName}</p>
          )}
        </div>

        {/* ¿Qué hacen? (opcional) */}
        <div>
          <label className="form-label">
            {t('authOrgDetailsWhat')}
          </label>
          <textarea
            rows={3}
            value={orgDescription}
            onChange={(e) => onChangeOrgDescription(e.target.value)}
            placeholder={t('authOrgDetailsWhatPlaceholder')}
            className="textarea-base"
          />
        </div>

        {/* Sitio web o red social (opcional) */}
        <div>
          <label className="form-label">
            {t('authOrgDetailsWebsite')}
          </label>
          <input
            type="text"
            value={orgWebsiteOrSocial}
            onChange={(e) => onChangeOrgWebsiteOrSocial(e.target.value)}
            placeholder={t('authOrgDetailsWebsitePlaceholder')}
            className="input-base"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {t('authOrgDetailsWebsiteHint')}
          </p>
        </div>
      </div>
    </div>
  );
};
