import React, { useMemo } from 'react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';

interface LegalPageProps {
  markdown: string;
}

/**
 * Lightweight markdown-to-HTML renderer for legal pages.
 * Supports: h1, h2, h3, bold, italic, unordered lists, paragraphs.
 */
function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close list if we're no longer in a list item
    if (inList && !line.startsWith('- ')) {
      html += '</ul>';
      inList = false;
    }

    // Headings
    if (line.startsWith('### ')) {
      html += `<h3>${inlineFormat(line.slice(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${inlineFormat(line.slice(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      html += `<h1>${inlineFormat(line.slice(2))}</h1>`;
    }
    // List items
    else if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${inlineFormat(line.slice(2))}</li>`;
    }
    // Empty line
    else if (line.trim() === '') {
      // skip
    }
    // Paragraph
    else {
      html += `<p>${inlineFormat(line)}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

function inlineFormat(text: string): string {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return text;
}

export const LegalPage: React.FC<LegalPageProps> = ({ markdown }) => {
  const htmlContent = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#1F1C1A] font-sans selection:bg-[#1B3A93] selection:text-white overflow-x-hidden">
      {/* Background Micro-glow accents */}
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

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
            >
              <span>Ir a la App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <div
            className="legal-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1F1C1A] text-slate-300 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-8 w-auto brightness-0 invert opacity-90" />
            <div className="border-l border-slate-700 pl-3">
              <p className="text-xs font-bold text-white">RaDAR de Ayuda</p>
              <p className="text-[11px] text-slate-400">Plataforma Ciudadana Abierta de Coordinación de Emergencias</p>
            </div>
          </div>

          {/* Datos de contacto en el Footer */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <a
              href="mailto:Info@radardeayuda.co"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-semibold bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Info@radardeayuda.co</span>
            </a>
            <a
              href="https://wa.me/573112323588"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-semibold bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: +57 311 232 3588</span>
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="/" className="hover:text-white transition-colors">Mapa Principal</a>
            <span>•</span>
            <a href="/guia" className="hover:text-white transition-colors">¿Cómo Funciona?</a>
            <span>•</span>
            <a href="/terminos" className="hover:text-white transition-colors">Términos</a>
            <span>•</span>
            <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
