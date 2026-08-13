import React from 'react';
import { ShieldCheck, MessageSquare, CheckCircle2, AlertTriangle, MapPin, Trash2, Phone, Eye, Flag, ArrowLeft } from 'lucide-react';

export const ModeradorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la plataforma</span>
          </a>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Guía del Moderador</h1>
              <p className="text-sm text-slate-300 mt-1">
                Aquí Hace Falta — Valle del Cauca
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-10">

        {/* Tareas del moderador */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Tareas del moderador
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900">Crear entradas nuevas de otras fuentes de información.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si encuentras una necesidad reportada en redes sociales, medios o grupos comunitarios que no está en la plataforma, agrégala.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900">Verificar la información que sea posible.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Confirma llamando al contacto o contrastando con fuentes oficiales.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900">Rechazar entradas evidentemente falsas.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si una entrada tiene información falsa o malintencionada, recházala.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900">Unificar entradas repetidas.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si hay dos o más entradas de la misma petición, elige una que contenga toda la información y elimina las demás para evitar dispersar la ayuda.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-900">Verificar geolocalización.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Algunas entradas no están bien ubicadas en el mapa. Revisa la dirección y ubícala lo mejor posible para que las personas puedan llegar con su ayuda.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">6</span>
                <div>
                  <strong className="text-slate-900">Reportar errores en el funcionamiento de la plataforma.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si algo no funciona correctamente, comunícalo al administrador.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ¿Cómo corroboro la información? */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            ¿Cómo corroboro la información?
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Llamando o escribiendo</strong> a la información de contacto que tienen algunos posts. Si el contacto confirma la necesidad, puedes marcarla como verificada.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Estando al tanto de información oficial</strong> de Defensa Civil, Bomberos, Cruz Roja y autoridades locales. Contrasta lo que reporta la ciudadanía con lo que informan las fuentes oficiales.
              </p>
            </div>
          </div>
        </section>

        {/* Instrucciones */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Instrucciones de uso
          </h2>

          {/* Actualizar info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900">Cómo editar una entrada</h3>
            <p className="text-sm text-slate-700">
              Cada entrada tiene un botón <strong>"Actualizar info"</strong>. Esto abre un editor que te permite hacer cambios en toda la información de la publicación.
            </p>
            <p className="text-sm text-slate-700">
              Todos los cambios que hagas como moderador quedarán registrados a tu nombre en el historial de cambios. Así otros moderadores sabrán que esta entrada ya ha sido actualizada oficialmente.
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-200 inline-block">
              <img src="/moderador/actualizar-info.webp" alt="Botón Actualizar info" />
            </div>
          </div>

          {/* Verificar cambios */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900">¿Cómo verificar los cambios recientes?</h3>
            <p className="text-sm text-slate-700">
              Cada entrada tiene en su tarjeta y en la interna el registro de cambios. Todos los cambios marcados con un <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> <strong>escudo azul</strong></span> han sido hechos por moderadores. Los que no tienen el escudo han sido actualizados por ciudadanos y valdría la pena revisarlos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarjeta con escudo de moderador</p>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/moderador/card-actualizada.webp" alt="Card actualizada por moderador" className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de cambios</p>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/moderador/historial-de-cambios.webp" alt="Historial de cambios" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reglas básicas */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Reglas básicas de moderación
          </h2>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-3">
            <ul className="space-y-2.5 text-sm text-amber-950">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Neutralidad:</strong> No modifiques el contenido para favorecer o perjudicar a ninguna persona u organización.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Precisión:</strong> Solo marca como "verificada" una entrada cuando tengas certeza razonable de que la información es correcta.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Respeto:</strong> Trata con respeto la información de los ciudadanos. Si debes rechazar una entrada, deja un motivo claro.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>No duplicar:</strong> Antes de crear una entrada nueva, busca si ya existe. Unifica en vez de duplicar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Actualización constante:</strong> Si una necesidad ya fue cubierta, actualiza su estado. La información desactualizada confunde a los voluntarios.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Confidencialidad:</strong> No compartas datos personales de los contactos fuera de la plataforma.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Reporta problemas:</strong> Si encuentras un bug o un abuso de la plataforma, comunícalo inmediatamente al administrador.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA: ¿Quieres ayudar a moderar? */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">
              ¿Quieres ayudar a moderar?
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Los moderadores verifican la información, actualizan prioridades y mantienen la plataforma confiable para toda la comunidad. Si quieres ser parte del equipo, ponte en contacto.
            </p>
            <a
              href="https://wa.me/@un.tal.juan"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contactar al administrador</span>
            </a>
            <p className="text-[11px] text-slate-400">
              Te responderemos lo antes posible por WhatsApp.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
