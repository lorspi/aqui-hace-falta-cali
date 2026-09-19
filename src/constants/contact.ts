/**
 * Constantes y helpers globales de contacto de la plataforma
 */

export const OFFICIAL_WHATSAPP_NUMBER = '573228262389';
export const OFFICIAL_WHATSAPP_DISPLAY = '+57 322 826 2389';

export const getOfficialWhatsappLink = (message?: string): string => {
  if (message) {
    return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}`;
};
