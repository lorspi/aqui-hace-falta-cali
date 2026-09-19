import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Formatea un texto detectando automáticamente URLs (http/https)
 * y convirtiéndolas en enlaces cliqueables seguros.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Regex para encontrar URLs http o https
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className={`whitespace-pre-line ${className}`}>
      {parts.map((part, i) => {
        if (part.match(/^https?:\/\//i)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue font-semibold underline hover:text-brand-blue-hover break-all inline-flex items-center gap-0.5 mx-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{part}</span>
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};
