import React from 'react';
import {
  Flame,
  ShieldAlert,
  PawPrint,
  HeartHandshake,
  Landmark,
  Users,
  Brain,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { OrganizationType } from '../../schemas/registerSchema';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { TranslationKey } from '../../../../i18n/translations';

interface StepOrgCategoryProps {
  selectedType: OrganizationType | '';
  onSelectType: (type: OrganizationType) => void;
}

interface OrgCategoryOption {
  id: OrganizationType;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: React.ElementType;
}

const ORG_CATEGORY_OPTIONS: OrgCategoryOption[] = [
  {
    id: 'bomberos_defensa_civil',
    titleKey: 'authOrgCatFirefighters',
    descriptionKey: 'authOrgCatFirefightersDesc',
    icon: Flame,
  },
  {
    id: 'organismo_rescate',
    titleKey: 'authOrgCatRescue',
    descriptionKey: 'authOrgCatRescueDesc',
    icon: ShieldAlert,
  },
  {
    id: 'ong_animal',
    titleKey: 'authOrgCatAnimal',
    descriptionKey: 'authOrgCatAnimalDesc',
    icon: PawPrint,
  },
  {
    id: 'ong_personas',
    titleKey: 'authOrgCatHumanitarian',
    descriptionKey: 'authOrgCatHumanitarianDesc',
    icon: HeartHandshake,
  },
  {
    id: 'municipalidad_gobierno',
    titleKey: 'authOrgCatGovernment',
    descriptionKey: 'authOrgCatGovernmentDesc',
    icon: Landmark,
  },
  {
    id: 'junta_vecinal',
    titleKey: 'authOrgCatCommunity',
    descriptionKey: 'authOrgCatCommunityDesc',
    icon: Users,
  },
  {
    id: 'apoyo_psicosocial',
    titleKey: 'authOrgCatPsychosocial',
    descriptionKey: 'authOrgCatPsychosocialDesc',
    icon: Brain,
  },
  {
    id: 'empresa_privada',
    titleKey: 'authOrgCatBusiness',
    descriptionKey: 'authOrgCatBusinessDesc',
    icon: Building2,
  },
  {
    id: 'profesional_individual',
    titleKey: 'authOrgCatHealth',
    descriptionKey: 'authOrgCatHealthDesc',
    icon: Stethoscope,
  },
];

export const StepOrgCategory: React.FC<StepOrgCategoryProps> = ({
  selectedType,
  onSelectType,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Encabezado del Paso 2 de Organización */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t('authOrgCategoryTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('authOrgCategorySubtitle')}
        </p>
      </div>

      {/* Lista Vertical de Tarjetas Seleccionables */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 cards-scroll">
        {ORG_CATEGORY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;

          return (
            <div
              key={option.id}
              onClick={() => onSelectType(option.id)}
              className={`
                p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-3.5
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-md shadow-blue-500/10 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }
              `}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {t(option.titleKey)}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug line-clamp-2">
                    {t(option.descriptionKey)}
                  </p>
                </div>
              </div>

              {/* Check Radio Indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }
                `}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
