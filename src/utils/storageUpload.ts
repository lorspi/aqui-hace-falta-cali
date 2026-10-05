import { supabase } from '../lib/supabaseClient';
import type { Foto } from '../types/flujo';

/**
 * Convierte un Blob de imagen a un DataURL en formato JPEG comprimido (máx 1200px, calidad ~0.82)
 * para asegurar persistencia local sin desbordar la cuota de almacenamiento.
 */
export async function compressBlobToDataUrl(blob: Blob, maxWidth = 1200, quality = 0.82): Promise<string> {
  if (typeof window === 'undefined') return '';
  return new Promise((resolve) => {
    if (!blob.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
      return;
    }

    const img = new Image();
    const tempUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    };
    img.src = tempUrl;
  });
}

/**
 * Sube las fotos de evidencia locales (blob: URLs) a Supabase Storage (bucket: 'evidence')
 * o genera un DataURL persistente comprimido como fallback garantizado,
 * retornando un arreglo de URLs persistentes listas para almacenar y mostrar.
 */
export async function uploadEvidencePhotos(fotos: Foto[], folder = 'evidence'): Promise<string[]> {
  if (!fotos || fotos.length === 0) return [];

  const publicUrls: string[] = [];

  for (const foto of fotos) {
    if (!foto.url) continue;

    // Si ya es una URL pública o DataURL persistente (no blob:), la conservamos directa
    if (!foto.url.startsWith('blob:')) {
      publicUrls.push(foto.url);
      continue;
    }

    try {
      // Descargar el blob local
      const res = await fetch(foto.url);
      const blob = await res.blob();

      let uploadedToStorage = false;
      try {
        const ext = foto.nombre?.split('.').pop() || 'jpg';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { data, error } = await supabase.storage
          .from('evidence')
          .upload(fileName, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(data.path);
          if (publicUrlData?.publicUrl) {
            publicUrls.push(publicUrlData.publicUrl);
            uploadedToStorage = true;
          }
        } else if (error) {
          console.warn('⚠️ Supabase storage upload warning (evidence bucket missing or permission denied):', error.message);
        }
      } catch (uploadErr) {
        console.warn('⚠️ Error al subir foto a Supabase storage:', uploadErr);
      }

      // Si no se pudo subir a Supabase Storage, usamos DataURL persistente comprimido
      // para que NUNCA se pierda ni quede como blob: efímero al refrescar
      if (!uploadedToStorage) {
        const fallbackDataUrl = await compressBlobToDataUrl(blob);
        if (fallbackDataUrl) {
          publicUrls.push(fallbackDataUrl);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al procesar subida o conversión de foto local:', err);
    }
  }

  return publicUrls;
}
