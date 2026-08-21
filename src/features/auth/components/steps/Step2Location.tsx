import React, { useMemo } from 'react';
import { MapPin, Globe, Compass, CheckCircle2 } from 'lucide-react';
import { DEPARTMENTS } from '../../../../data/colombiaCities';

interface Step2LocationProps {
  country: string;
  department: string;
  city: string;
  isAutoDetected?: boolean;
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

export const Step2Location: React.FC<Step2LocationProps> = ({
  country,
  department,
  city,
  isAutoDetected = true,
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
    // Reiniciar municipio al cambiar de departamento
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
    <div className="space-y-6">
      {/* Encabezado del Paso 2 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ¿Dónde estás?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Confirma tu ubicación para conectar con las solicitudes y apoyos más cercanos en tu territorio.
        </p>
      </div>

      {/* Banner Informativo Superior (Autodetectado) */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-blue-900 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
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

      {/* Formulario de Ubicación */}
      <div className="space-y-4">
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
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
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
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
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
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
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
                disabled={!department}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
