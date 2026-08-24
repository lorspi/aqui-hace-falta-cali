import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Shield, Building2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type Role = 'regular' | 'moderador' | 'gobierno' | null;

interface Step1Data {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface Step3ModeradorData {
  organization: string;
  motivation: string;
}

interface Step3GobiernoData {
  entity: string;
  position: string;
  officialEmail: string;
}

export const SimulatedRegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);

  // Step 1 data
  const [step1, setStep1] = useState<Step1Data>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Anti-bot captcha (simulated Turnstile)
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Step 3 data
  const [moderadorData, setModeradorData] = useState<Step3ModeradorData>({
    organization: '',
    motivation: '',
  });
  const [gobiernoData, setGobiernoData] = useState<Step3GobiernoData>({
    entity: '',
    position: '',
    officialEmail: '',
  });

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!step1.fullName.trim()) newErrors.fullName = 'El nombre es obligatorio';
    if (!step1.email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) newErrors.email = 'Correo no válido';
    if (!step1.password) newErrors.password = 'La contraseña es obligatoria';
    else if (step1.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!step1.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (step1.password !== step1.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!step1.acceptTerms) newErrors.acceptTerms = 'Debes aceptar los términos';
    if (!captchaVerified) newErrors.captcha = 'Completa la verificación anti-bot';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!role) {
      setErrors({ role: 'Selecciona un rol' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (role === 'moderador') {
      if (!moderadorData.motivation.trim()) newErrors.motivation = 'La motivación es obligatoria';
    } else if (role === 'gobierno') {
      if (!gobiernoData.entity.trim()) newErrors.entity = 'La entidad es obligatoria';
      if (!gobiernoData.position.trim()) newErrors.position = 'El cargo es obligatorio';
      if (!gobiernoData.officialEmail.trim()) newErrors.officialEmail = 'El correo oficial es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      if (role === 'regular') {
        // Skip step 3, go directly to confirmation
        setStep(4);
      } else {
        setStep(3);
      }
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 4 && role === 'regular') {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  const totalSteps = role === 'regular' ? 3 : 4;
  const displayStep = step === 4 && role === 'regular' ? 3 : step;

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#1F1C1A] font-sans selection:bg-[#1B3A93] selection:text-white overflow-x-hidden">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F2C33D]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#1B3A93]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/logo-radar.svg"
              alt="RaDAR de Ayuda Logo"
              className="h-9 sm:h-10 w-auto group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1B3A93]/10 text-[#1B3A93] border border-[#1B3A93]/20">
                Colombia
              </span>
            </div>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
          >
            <span>Ir a la App</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* Progress bar */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Paso {displayStep} de {totalSteps}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B3A93] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(displayStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {step === 1 && (
              <Step1Form
                data={step1}
                onChange={setStep1}
                errors={errors}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                captchaVerified={captchaVerified}
                onCaptchaVerified={() => setCaptchaVerified(true)}
              />
            )}
            {step === 2 && (
              <Step2Role role={role} onChange={setRole} error={errors.role} />
            )}
            {step === 3 && role === 'moderador' && (
              <Step3Moderador data={moderadorData} onChange={setModeradorData} errors={errors} />
            )}
            {step === 3 && role === 'gobierno' && (
              <Step3Gobierno data={gobiernoData} onChange={setGobiernoData} errors={errors} />
            )}
            {step === 4 && (
              <Step4Confirmation role={role} />
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 && step < 4 ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              ) : (
                <div />
              )}

              {step < 4 && (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 4 && (
                <a
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
                >
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────── STEP 1: Account ─────────────────────── */

interface Step1FormProps {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  errors: Record<string, string>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  captchaVerified: boolean;
  onCaptchaVerified: () => void;
}

const Step1Form: React.FC<Step1FormProps> = ({ data, onChange, errors, showPassword, showConfirmPassword, onTogglePassword, onToggleConfirmPassword, captchaVerified, onCaptchaVerified }) => {
  const update = (field: keyof Step1Data, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1C1A] mb-2">Crea tu cuenta</h2>
      <p className="text-sm text-slate-500 mb-6">
        Con una cuenta puedes hacer seguimiento a tus reportes y acceder a funciones avanzadas.
      </p>

      <div className="space-y-4">
        {/* Nombre completo */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre completo *</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Ej: María García López"
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        {/* Correo */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo electrónico *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl border ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirma contraseña *</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={data.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              placeholder="Repite tu contraseña"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl border ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Anti-bot verification — Simulated Turnstile */}
        <div className="pt-2">
          <TurnstileWidget verified={captchaVerified} onVerify={onCaptchaVerified} error={errors.captcha} />
          {errors.captcha && !captchaVerified && <p className="text-xs text-red-500 mt-1">{errors.captcha}</p>}
        </div>

        {/* Términos */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.acceptTerms}
              onChange={(e) => update('acceptTerms', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1B3A93] focus:ring-[#1B3A93]/30"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Acepto los{' '}
              <a href="/terminos" target="_blank" className="font-bold text-[#1B3A93] hover:underline">
                Términos y Condiciones
              </a>{' '}
              y la{' '}
              <a href="/privacidad" target="_blank" className="font-bold text-[#1B3A93] hover:underline">
                Política de Privacidad
              </a>
            </span>
          </label>
          {errors.acceptTerms && <p className="text-xs text-red-500 mt-1">{errors.acceptTerms}</p>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── STEP 2: Role ─────────────────────── */

interface Step2RoleProps {
  role: Role;
  onChange: (role: Role) => void;
  error?: string;
}

const Step2Role: React.FC<Step2RoleProps> = ({ role, onChange, error }) => {
  const roles: { id: Role; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'regular',
      label: 'Usuario regular',
      description: 'Puedes ver, crear y editar tus propios reportes',
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'moderador',
      label: 'Moderador',
      description: 'Ideal para líderes comunitarios con experiencia en verificación.',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: 'gobierno',
      label: 'Gobierno',
      description: 'Para funcionarios de entidades públicas con correo institucional.',
      icon: <Building2 className="w-5 h-5" />,
    },
  ];

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1C1A] mb-2">¿Cuál es tu rol?</h2>
      <p className="text-sm text-slate-500 mb-6">
        Elige el rol que describe tu participación. Obtendrás acceso inmediato como Usuario Regular mientras se procesa tu postulación.
      </p>

      <div className="space-y-3">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => onChange(r.id)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              role === r.id
                ? 'border-[#1B3A93] bg-[#1B3A93]/5 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              role === r.id ? 'bg-[#1B3A93] text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${role === r.id ? 'text-[#1B3A93]' : 'text-slate-800'}`}>
                {r.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
            </div>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              role === r.id ? 'border-[#1B3A93] bg-[#1B3A93]' : 'border-slate-300'
            }`}>
              {role === r.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
    </div>
  );
};

/* ─────────────────────── STEP 3: Moderador ─────────────────────── */

interface Step3ModeradorProps {
  data: Step3ModeradorData;
  onChange: (data: Step3ModeradorData) => void;
  errors: Record<string, string>;
}

const Step3Moderador: React.FC<Step3ModeradorProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1C1A] mb-2">Postulación como Moderador</h2>
      <p className="text-sm text-slate-500 mb-6">
        Cuéntanos sobre tu experiencia. Tu postulación será revisada por el equipo.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Colectivo / Organización comunitaria
          </label>
          <input
            type="text"
            value={data.organization}
            onChange={(e) => onChange({ ...data, organization: e.target.value })}
            placeholder="Ej: Junta de Acción Comunal Barrio X"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Motivación o experiencia para moderar *
          </label>
          <textarea
            value={data.motivation}
            onChange={(e) => onChange({ ...data, motivation: e.target.value })}
            placeholder="Describe tu experiencia en la comunidad y por qué quieres ser moderador..."
            rows={4}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.motivation ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all resize-none`}
          />
          {errors.motivation && <p className="text-xs text-red-500 mt-1">{errors.motivation}</p>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── STEP 3: Gobierno ─────────────────────── */

interface Step3GobiernoProps {
  data: Step3GobiernoData;
  onChange: (data: Step3GobiernoData) => void;
  errors: Record<string, string>;
}

const Step3Gobierno: React.FC<Step3GobiernoProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1C1A] mb-2">Verificación Gobierno</h2>
      <p className="text-sm text-slate-500 mb-6">
        Completa la información de tu entidad para validar tu acceso institucional.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Entidad / Dependencia gubernamental *
          </label>
          <input
            type="text"
            value={data.entity}
            onChange={(e) => onChange({ ...data, entity: e.target.value })}
            placeholder="Ej: Alcaldía de Cali - Secretaría de Gestión del Riesgo"
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.entity ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
          />
          {errors.entity && <p className="text-xs text-red-500 mt-1">{errors.entity}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Cargo institucional *
          </label>
          <input
            type="text"
            value={data.position}
            onChange={(e) => onChange({ ...data, position: e.target.value })}
            placeholder="Ej: Coordinador de Atención a Emergencias"
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.position ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
          />
          {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Correo electrónico oficial *
          </label>
          <input
            type="email"
            value={data.officialEmail}
            onChange={(e) => onChange({ ...data, officialEmail: e.target.value })}
            placeholder="nombre@entidad.gov.co"
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.officialEmail ? 'border-red-400 bg-red-50' : 'border-slate-200'} text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A93]/30 focus:border-[#1B3A93] transition-all`}
          />
          <p className="text-xs text-slate-400 mt-1">Debe ser un correo institucional (.gov o entidad oficial).</p>
          {errors.officialEmail && <p className="text-xs text-red-500 mt-1">{errors.officialEmail}</p>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── STEP 4: Confirmation ─────────────────────── */

interface Step4ConfirmationProps {
  role: Role;
}

const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({ role }) => {
  const getMessage = () => {
    if (role === 'regular') {
      return {
        title: '¡Cuenta creada exitosamente!',
        description: 'Ya puedes iniciar sesión y comenzar a usar la plataforma. Podrás crear reportes, hacer seguimiento y colaborar con tu comunidad.',
      };
    }
    if (role === 'moderador') {
      return {
        title: '¡Postulación enviada!',
        description: 'Tu cuenta ha sido creada como Usuario Regular. Tu postulación como Moderador será revisada por nuestro equipo y recibirás una notificación cuando sea aprobada.',
      };
    }
    return {
      title: '¡Solicitud enviada!',
      description: 'Tu cuenta ha sido creada como Usuario Regular. Tu solicitud de acceso como Gobierno será verificada con la entidad correspondiente. Te notificaremos cuando sea aprobada.',
    };
  };

  const { title, description } = getMessage();

  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-5">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F1C1A] mb-3">{title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">{description}</p>
    </div>
  );
};

/* ─────────────────────── Simulated Cloudflare Turnstile Widget ─────────────────────── */

interface TurnstileWidgetProps {
  verified: boolean;
  onVerify: () => void;
  error?: string;
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ verified, onVerify, error }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClick = () => {
    if (verified || isVerifying) return;
    setIsVerifying(true);
    // Simulate verification delay (1.2–2.5s like real Turnstile)
    const delay = 1200 + Math.random() * 1300;
    setTimeout(() => {
      setIsVerifying(false);
      onVerify();
    }, delay);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${
        error && !verified ? 'border-red-300' : 'border-slate-200'
      } bg-[#FAFAFA] shadow-sm`}
    >
      {/* Main widget area */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox / spinner / check */}
        <button
          type="button"
          onClick={handleClick}
          disabled={verified || isVerifying}
          className={`flex-shrink-0 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${
            verified
              ? 'border-[#2FA85C] bg-[#2FA85C]'
              : isVerifying
              ? 'border-slate-300 bg-white'
              : 'border-slate-300 bg-white hover:border-slate-400 cursor-pointer'
          }`}
          aria-label="Verificar que no soy un robot"
        >
          {verified && (
            <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isVerifying && (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-[#F6A623] rounded-full animate-spin" />
          )}
        </button>

        {/* Label */}
        <span className={`text-[13px] select-none ${verified ? 'text-slate-700' : 'text-slate-600'}`}>
          {isVerifying ? 'Verificando...' : verified ? 'Verificación exitosa' : 'Verifica que no eres un robot'}
        </span>
      </div>

      {/* Branding bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#F0F0F0] border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          {/* Cloudflare logo simplified */}
          <svg className="w-[18px] h-[18px]" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M44.5 36.6c-.2-.7-.8-1.2-1.5-1.2l-18.8-.3c-.2 0-.3-.1-.4-.2-.1-.1-.1-.3 0-.4.1-.2.2-.3.4-.3l19-.3c1.5-.1 3.1-1.3 3.7-2.8l.8-2c0-.1.1-.2 0-.3-1.4-6.5-7.2-11.3-14.1-11.3-6.3 0-11.6 4-13.6 9.6-.9-.7-2.1-1.1-3.3-1-2.2.2-3.9 2-4.1 4.2 0 .5 0 1 .1 1.5-3.8.1-6.8 3.2-6.8 7 0 .4 0 .7.1 1.1.1.3.3.4.5.4h37.4c.3 0 .5-.2.6-.4l.3-1.1c.2-.8.2-1.5-.3-2.2z" fill="#F6821F"/>
            <path d="M48.5 24.2c-.3 0-.5 0-.8.1 0-.1 0-.2-.1-.3-1.7-6.2-7.4-10.7-14.1-10.7-5.8 0-10.8 3.4-13.2 8.3" fill="none"/>
            <path d="M49.2 25.7h-.5c-.2 0-.3.1-.4.3l-.5 1.8c-.2.7-.2 1.5.1 2.2.2.7.8 1.2 1.5 1.2l2.5.1c.2 0 .3.1.4.2.1.1.1.3 0 .4-.1.2-.2.3-.4.3l-2.7.1c-1.5.1-3.1 1.3-3.7 2.8l-.2.6c-.1.2.1.4.3.4h10.8c.2 0 .4-.2.5-.4.3-1 .4-2 .4-3.1-.1-3.8-3.2-6.9-7-6.9h-1.1z" fill="#FAAD3F"/>
          </svg>
          <span className="text-[10px] font-medium text-slate-500">Cloudflare Turnstile</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="text-slate-400 hover:text-slate-500" aria-label="Información">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 110 2 1 1 0 010-2zM9 11H7V7h2v4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
