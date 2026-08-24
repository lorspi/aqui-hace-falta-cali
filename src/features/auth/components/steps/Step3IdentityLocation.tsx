import React, { useMemo } from 'react';
import { CreditCard, FileText, Globe, Compass, MapPin, CheckCircle2 } from 'lucide-react';
import { DocumentType } from '../../schemas/registerSchema';
import { DEPARTMENTS } from '../../../../data/colombiaCities';

interface Step3IdentityLocationProps {
  documentType: DocumentType;
  documentNumber: string;
  country: string;
  department: string;
  city: string;
  isSubmitting?: boolean;
  errors?: {
    documentNumber?: string;
    city?: string;
  };
  onChangeDocumentType: (type: DocumentType) => void;
  onChangeDocumentNumber: (val: string) => void;
  onChangeCountry: (country: string) => void;
  onChangeDepartment: (dept: string) => void;
  onChangeCity: (city: string) => void;
}

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
];

export const Step3IdentityLocation: React.FC<Step3IdentityLocationProps> = ({
  documentType,
  documentNumber,
  country,
  department,
  city,
  isSubmitting = false,
  errors,
  onChangeDocumentType,
  onChangeDocumentNumber,
  onChangeCountry,
  onChangeDepartment,
  onChangeCity,
}) => {
  // Lista dinámica de departamentos
  const departmentList = useMemo(() => {
    return DEPARTMENTS.map((d) => d.name).sort();
  }, []);

  // Lista dinámica de municipios según el departamento seleccionado
  const cityList = useMemo(() => {
    if (!department) return [];
    const deptObj = DEPARTMENTS.find(
      (d) => d.name.toLowerCase() === department.toLowerCase()
    );
    return deptObj ? deptObj.cities.map((c) => c.name).sort() : [];
  }, [department]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDept = e.target.value;
    onChangeDepartment(newDept);
    const deptObj = DEPARTMENTS.find(
      (d) => d.name.toLowerCase() === newDept.toLowerCase()
    );
    if (deptObj && deptObj.cities.length > 0) {
      onChangeCity(deptObj.cities[0].name);
    } else {
      onChangeCity('');
    }
  };

  return (
    <div className="space-y-5 py-2">
      {/* Encabezado del Paso 3 */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ¿Dónde estás?
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Confirma tu identificación y ubicación para conectar con las solicitudes y apoyos más cercanos en tu territorio.
        </p>
      </div>

      {/* Banner de Ubicación detectada automáticamente */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-blue-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-950">
            <span>Ubicación detectada automáticamente</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 inline shrink-0" />
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Parece que estás en <strong className="text-slate-900 font-semibold">{city || 'Armenia'}, {department || 'Quindío'}, {country || 'Colombia'}</strong>. Ya lo completamos por ti; si no es correcto, cámbialo abajo.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {/* Fila: Tipo de Documento y Número de Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tipo de Documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Documento <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <select
                value={documentType}
                onChange={(e) => onChangeDocumentType(e.target.value as DocumentType)}
                disabled={isSubmitting}
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
              Número de Documento <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => onChangeDocumentNumber(e.target.value)}
                placeholder="Ej: 1023456789"
                disabled={isSubmitting}
                className={`
                  w-full px-4 py-2.5 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
                  ${
                    errors?.documentNumber
                      ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
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

        {/* Sección de Ubicación Territorial */}
        <div className="space-y-4 pt-1">
          {/* País */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              País
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <select
                value={country}
                onChange={(e) => onChangeCountry(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer shadow-xs"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departamento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Departamento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Compass className="w-4 h-4" />
                </div>
                <select
                  value={department}
                  onChange={handleDepartmentChange}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer shadow-xs"
                >
                  <option value="" disabled>
                    Selecciona departamento
                  </option>
                  {departmentList.map((deptName) => (
                    <option key={deptName} value={deptName}>
                      {deptName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Municipio / Ciudad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Municipio / Ciudad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <select
                  value={city}
                  onChange={(e) => onChangeCity(e.target.value)}
                  disabled={!department || isSubmitting}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer shadow-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    Selecciona municipio
                  </option>
                  {cityList.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
