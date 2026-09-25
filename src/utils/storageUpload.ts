import { supabase } from '../lib/supabaseClient';
import type { Foto } from '../types/flujo';

/**
 * Sube las fotos de evidencia locales (blob: URLs) a Supabase Storage (bucket: 'evidence')
 * y retorna un arreglo de URLs públicas resultantes.
 */
export async function uploadEvidencePhotos(fotos: Foto[], folder = 'evidence'): Promise<string[]> {
  if (!fotos || fotos.length === 0) return [];

  const publicUrls: string[] = [];

  for (const foto of fotos) {
    if (!foto.url) continue;

    // Si ya es una URL pública (no blob:), la conservamos directa
    if (!foto.url.startsWith('blob:') && !foto.url.startsWith('data:')) {
      publicUrls.push(foto.url);
      continue;
    }

    try {
      // Descargar el blob local
      const res = await fetch(foto.url);
      const blob = await res.blob();

      const ext = foto.nombre?.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.warn('⚠️ Supabase storage upload warning (evidence bucket missing or permission denied):', error.message);
        // Si el bucket falla, no interrumpir la transacción
        continue;
      }

      if (data?.path) {
        const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          publicUrls.push(publicUrlData.publicUrl);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al procesar subida de foto local:', err);
    }
  }

  return publicUrls;
}
