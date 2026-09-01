import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Footer } from './Footer';

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
      <Footer />
    </div>
  );
};
