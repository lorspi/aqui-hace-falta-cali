import { supabase } from '../lib/supabaseClient';
import type { DocumentoVerificacion } from '../types/panel';

/**
 * Documentos de verificación simulados para organizaciones y comunidades preexistentes
 * Permite que el administrador vea miniaturas y detalles de prueba de inmediato.
 */
export const MOCK_ORG_DOCS: Record<string, DocumentoVerificacion[]> = {
  'Bomberos Voluntarios Usme': [
    {
      id: 'doc-usme-rut',
      nombre: 'RUT_Dian_Bomberos_Usme_2026.pdf',
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      tipo: 'imagen',
      categoria: 'NIT / RUT',
      peso: '1.4 MB',
      creadoEn: '10 de sep 2026',
    },
    {
      id: 'doc-usme-personeria',
      nombre: 'Resolucion_Personeria_CuerpoSocorro.jpg',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      tipo: 'imagen',
      categoria: 'Carta o personería',
      peso: '850 KB',
      creadoEn: '11 de sep 2026',
    },
  ],
  'Albergue Bosa': [
    {
      id: 'doc-bosa-acta',
      nombre: 'Acta_Constitucion_Comunitaria_Albergue.jpg',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      tipo: 'imagen',
      categoria: 'Acta comunitaria',
      peso: '920 KB',
      creadoEn: '12 de sep 2026',
    },
  ],
  'Comedor Villa Gloria': [
    {
      id: 'doc-vg-carta',
      nombre: 'Carta_Acreditacion_Junta_Accion_Comunal.pdf',
      url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=800&q=80',
      tipo: 'imagen',
      categoria: 'Acta comunitaria',
      peso: '1.1 MB',
      creadoEn: '13 de sep 2026',
    },
  ],
};

function normalizarClave(txt: string): string {
  return txt.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

/**
 * Carga los documentos de verificación del usuario actual desde localStorage o Supabase
 */
export function cargarDocumentosUsuario(userId?: string | null, email?: string): DocumentoVerificacion[] {
  if (typeof window === 'undefined') return [];
  const idKey = userId ? `ahf_user_docs_${userId}` : '';
  const emailKey = email ? `ahf_user_docs_${normalizarClave(email)}` : '';

  if (idKey) {
    const saved = localStorage.getItem(idKey);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
  }

  if (emailKey) {
    const saved = localStorage.getItem(emailKey);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
  }

  // Clave genérica para pruebas locales
  const fallback = localStorage.getItem('ahf_current_user_verification_docs');
  if (fallback) {
    try { return JSON.parse(fallback); } catch {}
  }

  return [];
}

/**
 * Guarda los documentos de verificación del usuario y sincroniza con Supabase si está disponible
 */
export async function guardarDocumentosUsuario(
  userId: string | null | undefined,
  docs: DocumentoVerificacion[],
  email?: string,
  orgName?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    if (userId) {
      localStorage.setItem(`ahf_user_docs_${userId}`, JSON.stringify(docs));
    }
    if (email) {
      localStorage.setItem(`ahf_user_docs_${normalizarClave(email)}`, JSON.stringify(docs));
    }
    localStorage.setItem('ahf_current_user_verification_docs', JSON.stringify(docs));

    // Si tiene organización vinculada, guardar también en la clave de la organización
    if (orgName) {
      guardarDocumentosOrg(null, docs, orgName, userId ?? undefined);
    }
  }

  // Intento de persistencia silenciosa en Supabase (si la columna existiese en la BD)
  if (userId) {
    try {
      await supabase.from('profiles').update({
        verification_documents: docs,
      } as any).eq('id', userId);
    } catch {
      // Ignorar si no existe la columna en el backend actual
    }

    if (orgName) {
      try {
        await supabase.from('organizations').update({
          verification_documents: docs,
        } as any).eq('user_id', userId);
      } catch {
        // Ignorar si no existe la columna
      }
    }
  }
}

/**
 * Carga los documentos de verificación de una organización o comunidad para el Panel Admin
 */
export function cargarDocumentosOrg(
  orgId?: string | null,
  orgName?: string,
  userId?: string
): DocumentoVerificacion[] {
  if (typeof window === 'undefined') return [];

  // 1. Buscar por orgId
  if (orgId) {
    const savedById = localStorage.getItem(`ahf_org_docs_${orgId}`);
    if (savedById) {
      try { return JSON.parse(savedById); } catch {}
    }
  }

  // 2. Buscar por nombre normalizado
  if (orgName) {
    const savedByName = localStorage.getItem(`ahf_org_docs_${normalizarClave(orgName)}`);
    if (savedByName) {
      try { return JSON.parse(savedByName); } catch {}
    }
  }

  // 3. Buscar por userId de quien la creó
  if (userId) {
    const savedByUser = localStorage.getItem(`ahf_user_docs_${userId}`);
    if (savedByUser) {
      try { return JSON.parse(savedByUser); } catch {}
    }
  }

  // 4. Fallback a Mocks predefinidos para organizaciones reconocidas
  if (orgName && MOCK_ORG_DOCS[orgName]) {
    return MOCK_ORG_DOCS[orgName];
  }

  // Buscar coincidencia parcial en mocks
  if (orgName) {
    const match = Object.keys(MOCK_ORG_DOCS).find((k) =>
      k.toLowerCase().includes(orgName.toLowerCase()) || orgName.toLowerCase().includes(k.toLowerCase())
    );
    if (match) return MOCK_ORG_DOCS[match];
  }

  return [];
}

/**
 * Guarda los documentos de una organización en localStorage y Supabase
 */
export async function guardarDocumentosOrg(
  orgId?: string | null,
  docs: DocumentoVerificacion[] = [],
  orgName?: string,
  userId?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    if (orgId) {
      localStorage.setItem(`ahf_org_docs_${orgId}`, JSON.stringify(docs));
    }
    if (orgName) {
      localStorage.setItem(`ahf_org_docs_${normalizarClave(orgName)}`, JSON.stringify(docs));
    }
    if (userId) {
      localStorage.setItem(`ahf_user_docs_${userId}`, JSON.stringify(docs));
    }
  }

  if (orgId) {
    try {
      await supabase.from('organizations').update({
        verification_documents: docs,
      } as any).eq('id', orgId);
    } catch {}
  } else if (userId) {
    try {
      await supabase.from('organizations').update({
        verification_documents: docs,
      } as any).eq('user_id', userId);
    } catch {}
  }
}

/**
 * Convierte un archivo local a objeto DocumentoVerificacion,
 * subiéndolo opcionalmente a Supabase Storage (bucket 'evidence' o fallback data URL)
 */
export async function procesarArchivoVerificacion(
  archivo: File,
  categoria: DocumentoVerificacion['categoria'] = 'Otro'
): Promise<DocumentoVerificacion> {
  const esPdf = archivo.type.includes('pdf') || archivo.name.toLowerCase().endsWith('.pdf');
  const esImagen = archivo.type.startsWith('image/');
  const tipo: DocumentoVerificacion['tipo'] = esPdf ? 'pdf' : esImagen ? 'imagen' : 'archivo';

  const pesoLegible = (b: number) =>
    b >= 1024 * 1024
      ? `${(Math.round((b / 1024 / 1024) * 10) / 10).toString().replace('.', ',')} MB`
      : `${Math.round(b / 1024)} KB`;

  let urlFinal = URL.createObjectURL(archivo);

  // Intentar subir a Supabase Storage en segundo plano
  try {
    const ext = archivo.name.split('.').pop() || (esPdf ? 'pdf' : 'jpg');
    const path = `verification/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('evidence')
      .upload(path, archivo, {
        contentType: archivo.type || (esPdf ? 'application/pdf' : 'image/jpeg'),
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: pubData } = supabase.storage.from('evidence').getPublicUrl(data.path);
      if (pubData?.publicUrl) {
        urlFinal = pubData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Almacenamiento local para documento de verificación (Supabase no configurado):', err);
  }

  const hoy = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    nombre: archivo.name,
    url: urlFinal,
    tipo,
    categoria,
    peso: pesoLegible(archivo.size),
    creadoEn: hoy,
  };
}
