import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, CheckCircle2, Loader2, Sparkles, Phone, MapPin, MessageSquarePlus } from 'lucide-react';
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
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        text: '¡Hola! 👋 Te ayudaré a registrar tu necesidad de forma muy rápida. ¿Qué ayuda o recurso necesitas? (Ej: Alimentos y agua para 3 familias).',
      },
    ]);
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
        text: 'Perfecto. 📞 Por favor ingresa tu número de teléfono de contacto para que el equipo te pueda llamar o escribir por WhatsApp:',
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
          text: '¡Muchas gracias! 💚 Recibimos tus datos correctamente en el sistema. Un integrante de nuestro equipo de moderación te contactará a la brevedad para coordinar la solicitud.',
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
          text: 'Ocurrió un inconveniente al guardar el ticket. Por favor inténtalo de nuevo.',
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[600px] max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del Chatbot */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>Asistente raDAR</span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Ticket Rápido
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Responde 4 preguntas breves</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de Mensajes Conversacionales */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'bot'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'bot'
                    ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none font-medium'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 rounded-tr-none font-semibold'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isSubmitting && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando ticket en el sistema...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Entrada de Formulario / Respuesta según el paso */}
        <div className="p-3.5 bg-white border-t border-slate-200">
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
                className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl cursor-pointer transition-all"
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
                className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl cursor-pointer transition-all"
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
                  className="py-2.5 px-3 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900"
                  autoFocus
                />
                <input
                  type="text"
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  placeholder="Tu nombre (opcional)"
                  className="py-2.5 px-3 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || inputText.replace(/[^0-9+]/g, '').length < 7}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
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
                  className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => handleSendStep4(true)}
                disabled={isSubmitting}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer text-center"
              >
                Omitir este paso
              </button>
            </div>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendido, Cerrar</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
