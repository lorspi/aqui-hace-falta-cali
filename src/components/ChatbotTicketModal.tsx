import React, { useState, useEffect, useRef } from 'react';
import { X, Send, HeartHandshake, User, CheckCircle2, Loader2, Clock, Phone, MapPin } from 'lucide-react';
import { createQuickTicket } from '../lib/supabaseService';
import { useTranslation } from '../i18n/LanguageContext';

interface ChatbotTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const ChatbotTicketModal: React.FC<ChatbotTicketModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [inputText, setInputText] = useState('');
  const [contactNameInput, setContactNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collected Data
  const [needSummary, setNeedSummary] = useState('');
  const [locationText, setLocationText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewportState, setViewportState] = useState<{ height: number; offsetTop: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportState({
          height: window.visualViewport.height,
          offsetTop: window.visualViewport.offsetTop,
        });
      } else {
        setViewportState({
          height: window.innerHeight,
          offsetTop: 0,
        });
      }
    };

    handleResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset Chatbot State on Open
    setStep(1);
    setInputText('');
    setContactNameInput('');
    setIsSubmitting(false);
    setNeedSummary('');
    setLocationText('');
    setContactPhone('');
    setContactName('');
    setAdditionalDetails('');

    setMessages([
      {
        id: 'msg-1',
        sender: 'bot',
        text: '¡Hola! Estamos aquí para apoyarte. 🤝 Cuéntanos brevemente qué situación o necesidad urgente tienes (Ej: Alimentos y agua para 3 familias).',
      },
    ]);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  if (!isOpen) return null;

  const handleSendStep1 = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setNeedSummary(userText);
    setInputText('');

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userText },
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Entendido. 📍 ¿En qué barrio, dirección o municipio te encuentras?',
      },
    ]);

    setStep(2);
  };

  const handleSendStep2 = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setLocationText(userText);
    setInputText('');

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userText },
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Perfecto. 📞 Por favor ingresa tu número de teléfono de contacto para que el equipo pueda comunicarse contigo:',
      },
    ]);

    setStep(3);
  };

  const handleSendStep3 = () => {
    const cleanPhone = inputText.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) return;

    setContactPhone(cleanPhone);
    setContactName(contactNameInput.trim());
    setInputText('');

    const formattedContactText = contactNameInput.trim()
      ? `Teléfono: ${cleanPhone} (${contactNameInput.trim()})`
      : `Teléfono: ${cleanPhone}`;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: formattedContactText },
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '¿Hay algún detalle adicional que quieras agregar para el equipo? (Si no tienes nada más, puedes hacer clic en Omitir o Enviar).',
      },
    ]);

    setStep(4);
  };

  const handleSendStep4 = async (skip: boolean = false) => {
    const userText = skip ? 'Sin detalles adicionales' : inputText.trim();
    const finalDetails = skip ? '' : inputText.trim();
    setAdditionalDetails(finalDetails);
    setInputText('');

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userText },
    ]);

    setIsSubmitting(true);

    try {
      await createQuickTicket({
        needSummary,
        locationText,
        contactPhone,
        contactName: contactName || undefined,
        additionalDetails: finalDetails || undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '¡Muchas gracias! 🧡 Recibimos tus datos correctamente en el sistema. Un integrante de nuestro equipo de apoyo te contactará a la brevedad para coordinar la solicitud.',
        },
      ]);

      setStep(5);
    } catch (err) {
      console.error('[ChatbotTicketModal] Error saving quick ticket:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Ocurrió un inconveniente al guardar el reporte. Por favor inténtalo de nuevo.',
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKeyboardOpen = Boolean(viewportState && viewportState.height < 520);
  const dynamicHeight = viewportState
    ? Math.min(viewportState.height - (isKeyboardOpen ? 12 : 32), 580)
    : undefined;

  return (
    <div
      className={`fixed inset-x-0 z-50 bg-slate-900/70 backdrop-blur-xs flex ${
        isKeyboardOpen ? 'items-start pt-2 px-2' : 'items-center justify-center p-3 sm:p-6'
      } overflow-hidden`}
      style={{
        top: viewportState ? `${viewportState.offsetTop}px` : 0,
        height: viewportState ? `${viewportState.height}px` : '100vh',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-150 transition-[height,max-height]"
        style={{
          height: dynamicHeight ? `${dynamicHeight}px` : undefined,
          maxHeight: dynamicHeight ? `${dynamicHeight}px` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera del Asistente */}
        <div className={`px-4 ${isKeyboardOpen ? 'py-2' : 'py-3 sm:py-3.5'} bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md space-y-1.5 shrink-0 transition-all`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`${isKeyboardOpen ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shadow-xs shrink-0 transition-all`}>
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                    Pedir Ayuda Inmediata
                  </h3>
                  <span className="text-[9px] font-bold bg-white/20 text-white border border-white/30 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-2.5 h-2.5" /> En 1 min
                  </span>
                </div>
                {!isKeyboardOpen && (
                  <p className="text-[10px] sm:text-[11px] text-blue-100 font-medium truncate">Red comunitaria de ayuda</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-1"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Barra de Progreso de 4 Pasos */}
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${step >= 4 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Área de Mensajes Conversacionales */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  msg.sender === 'bot'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {msg.sender === 'bot' ? <HeartHandshake className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs leading-relaxed ${
                  msg.sender === 'bot'
                    ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none font-medium'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 rounded-tr-none font-semibold'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Tarjeta de Resumen en Paso 5 */}
          {step === 5 && (
            <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 text-[11px] sm:text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Resumen de tu reporte de ayuda:</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-700 pl-1 border-t border-blue-200/60 pt-1.5">
                <div><span className="font-bold text-slate-900">📌 Necesidad:</span> {needSummary}</div>
                <div><span className="font-bold text-slate-900">📍 Lugar:</span> {locationText}</div>
                <div><span className="font-bold text-slate-900">📞 Contacto:</span> {contactPhone} {contactName ? `(${contactName})` : ''}</div>
                {additionalDetails && <div><span className="font-bold text-slate-900">📝 Detalles:</span> {additionalDetails}</div>}
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando tu solicitud en el sistema...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Entrada de Formulario / Respuesta según el paso */}
        <div className="p-2.5 sm:p-3.5 bg-white border-t border-slate-200 shrink-0">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendStep1();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                maxLength={280}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu necesidad (máx 280 car)..."
                className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-hidden transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendStep2();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu barrio, dirección o municipio..."
                className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-hidden transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendStep3();
              }}
              className="space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="Teléfono (obligatorio) *"
                  className="py-2 sm:py-2.5 px-3 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-hidden transition-all"
                  autoFocus
                />
                <input
                  type="text"
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  placeholder="Tu nombre (opcional)"
                  className="py-2 sm:py-2.5 px-3 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-hidden transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || inputText.replace(/[^0-9+]/g, '').length < 7}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-600/20"
              >
                <span>Continuar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendStep4(false);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Detalles adicionales (opcional)..."
                  className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-hidden transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => handleSendStep4(true)}
                disabled={isSubmitting}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer text-center transition-colors"
              >
                Omitir este paso
              </button>
            </div>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendido, Volver al Mapa</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
