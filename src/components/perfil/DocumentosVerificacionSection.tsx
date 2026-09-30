import React, { useEffect, useId, useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Eye,
  ShieldCheck,
  X,
  FileCheck,
  AlertCircle,
  File,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Caja } from '../ui/Caja';
import { InlineNotice } from '../ui/InlineNotice';
import { useAviso } from '../ui/AvisoCorto';
import type { DocumentoVerificacion, DatosOrg } from '../../types/panel';
import type { PersonaExt } from '../../pages/perfil/PerfilPage';
import {
  cargarDocumentosUsuario,
  guardarDocumentosUsuario,
  procesarArchivoVerificacion,
} from '../../utils/documentosVerificacion';

export interface DocumentosVerificacionSectionProps {
  yo: PersonaExt;
  dbUserId?: string | null;
  orgData?: DatosOrg | null;
  onDocumentosActualizados?: (docs: DocumentoVerificacion[]) => void;
}

const CATEGORIAS_POR_ROL: Record<string, DocumentoVerificacion['categoria'][]> = {
  organizacion: ['NIT / RUT', 'Cámara de Comercio', 'Cédula', 'Carta o personería', 'Otro'],
  lider: ['Acta comunitaria', 'Carta o personería', 'Cédula', 'NIT / RUT', 'Otro'],
  voluntario: ['Cédula', 'Carta o personería', 'Otro'],
};

export const DocumentosVerificacionSection: React.FC<DocumentosVerificacionSectionProps> = ({
  yo,
  dbUserId,
  orgData,
  onDocumentosActualizados,
}) => {
  const avisar = useAviso();
  const fileInputId = useId();

  const [documentos, setDocumentos] = useState<DocumentoVerificacion[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<DocumentoVerificacion['categoria']>('NIT / RUT');
  const [cargando, setCargando] = useState(false);
  const [docVistaPrevia, setDocVistaPrevia] = useState<DocumentoVerificacion | null>(null);

  // Opciones de categoría según tipo de perfil
  const categoriasDisponibles = CATEGORIAS_POR_ROL[yo.tipoPerfil || 'voluntario'] || [
    'Cédula',
    'NIT / RUT',
    'Acta comunitaria',
    'Otro',
  ];

  // Cargar documentos al inicio
  useEffect(() => {
    const docs = cargarDocumentosUsuario(dbUserId, yo.correo);
    setDocumentos(docs);
    if (categoriasDisponibles.length > 0) {
      setCategoriaSeleccionada(categoriasDisponibles[0]);
    }
  }, [dbUserId, yo.correo, yo.tipoPerfil]);

  const handleSubirArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    setCargando(true);
    try {
      const nuevosDocs: DocumentoVerificacion[] = [];

      for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i];
        if (file.size > 25 * 1024 * 1024) {
          avisar(`El archivo ${file.name} supera 25 MB y fue omitido.`, { tipo: 'error' });
          continue;
        }

        const procesado = await procesarArchivoVerificacion(file, categoriaSeleccionada);
        nuevosDocs.push(procesado);
      }

      if (nuevosDocs.length > 0) {
        const actualizados = [...documentos, ...nuevosDocs];
        setDocumentos(actualizados);
        await guardarDocumentosUsuario(dbUserId, actualizados, yo.correo, orgData?.nombre);
        onDocumentosActualizados?.(actualizados);
        avisar(
          nuevosDocs.length === 1
            ? 'Documento guardado para revisión.'
            : `${nuevosDocs.length} documentos guardados para revisión.`,
          { tipo: 'ok' }
        );
      }
    } catch (err) {
      console.error('Error al subir documento:', err);
      avisar('Hubo un error al procesar el archivo.', { tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarDocumento = async (id: string) => {
    const filtrados = documentos.filter((d) => d.id !== id);
    setDocumentos(filtrados);
    await guardarDocumentosUsuario(dbUserId, filtrados, yo.correo, orgData?.nombre);
    onDocumentosActualizados?.(filtrados);
    avisar('Documento eliminado.', { tipo: 'ok' });
  };

  const estaVerificado = orgData?.verificacion === 'verificada';
  const tienePendientes = documentos.length > 0 && !estaVerificado;

  return (
    <Caja
      titulo="Documentos de verificación"
      accion={
        documentos.length > 0 ? (
          <span className="text-rd-11 font-semibold text-rd-ink-meta bg-rd-fondo px-2.5 py-1 rounded-rd-sm border border-rd-line">
            {documentos.length} {documentos.length === 1 ? 'documento' : 'documentos'}
          </span>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Aviso contextual según estado */}
        {estaVerificado ? (
          <InlineNotice variante="hecho" titulo="Cuenta verificada">
            Los documentos fueron validados satisfactoriamente por el equipo de moderación.
          </InlineNotice>
        ) : tienePendientes ? (
          <InlineNotice variante="pendiente" titulo="Documentos en revisión">
            El equipo de administración revisará tus soportes para validar la cuenta y otorgar el sello oficial de verificación.
          </InlineNotice>
        ) : (
          <InlineNotice variante="info" titulo="Documentos para verificación">
            {yo.tipoPerfil === 'organizacion' && (
              <span>Sube el <strong>NIT / RUT</strong>, <strong>Cámara de Comercio</strong> o <strong>cédula del representante</strong> para verificar tu organización.</span>
            )}
            {yo.tipoPerfil === 'lider' && (
              <span>Sube el <strong>acta comunitaria</strong>, personería jurídica o carta de la JAC para verificar tu comunidad.</span>
            )}
            {yo.tipoPerfil === 'voluntario' && (
              <span>Sube tu <strong>documento de identidad</strong> (cédula de ciudadanía o extranjería) para verificar tu cuenta ciudadana.</span>
            )}
          </InlineNotice>
        )}

        {/* Zona de subida */}
        <div className="rounded-rd-lg border border-dashed border-rd-line bg-rd-fondo/40 p-4 transition-colors hover:border-rd-navy/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-rd-navy shrink-0" />
              <div>
                <b className="block text-rd-13 font-semibold text-rd-ink">Subir nuevo documento o foto</b>
                <span className="text-rd-11 text-rd-ink-meta">Formatos permitidos: PDF, JPG, PNG, WebP (máx. 25 MB)</span>
              </div>
            </div>

            {/* Selector de categoría */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="select-cat-doc" className="text-rd-11 font-medium text-rd-ink-meta">
                Tipo:
              </label>
              <select
                id="select-cat-doc"
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value as any)}
                className="select-base text-rd-12 py-1 px-2.5 h-8 bg-rd-surface rounded-rd-md border border-rd-line text-rd-ink focus:border-rd-navy"
              >
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label
            htmlFor={fileInputId}
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-rd-md border border-rd-line bg-rd-surface py-5 px-4 text-center transition-colors hover:border-rd-navy hover:bg-rd-sunken/40"
          >
            <input
              id={fileInputId}
              type="file"
              accept="image/*,application/pdf"
              multiple
              disabled={cargando}
              className="sr-only"
              onChange={(e) => {
                handleSubirArchivos(e.target.files);
                e.target.value = '';
              }}
            />
            <FileText className="h-6 w-6 text-rd-navy" />
            <span className="text-rd-13 font-semibold text-rd-ink">
              {cargando ? 'Procesando archivo...' : 'Seleccionar archivo o foto'}
            </span>
            <span className="text-rd-11 text-rd-ink-meta">Haz clic para buscar en tu dispositivo</span>
          </label>
        </div>

        {/* Lista de documentos subidos */}
        {documentos.length > 0 && (
          <div>
            <h3 className="font-rd m-0 mb-2.5 text-rd-12-5 font-semibold text-rd-ink">
              Documentos adjuntos ({documentos.length})
            </h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {documentos.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-3 transition-colors hover:border-rd-ink-3/40"
                >
                  {/* Miniatura / Icono */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setDocVistaPrevia(doc)}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-rd-md border border-rd-line bg-rd-sunken p-0 cursor-pointer group"
                      title="Ver vista previa"
                    >
                      {doc.tipo === 'imagen' ? (
                        <img
                          src={doc.url}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-red-50 text-red-700">
                          <FileText className="h-5 w-5" />
                          <span className="text-rd-9 font-bold">PDF</span>
                        </div>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-rd-13 font-semibold text-rd-ink truncate max-w-sm">
                          {doc.nombre}
                        </span>
                        {doc.categoria && (
                          <span className="inline-block rounded-rd-sm border border-rd-navy-line bg-rd-navy-soft px-1.5 py-0.5 text-rd-10 font-bold text-rd-navy">
                            {doc.categoria}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-rd-11 text-rd-ink-meta mt-0.5">
                        {doc.peso && <span>{doc.peso}</span>}
                        <span>•</span>
                        <span>Subido el {doc.creadoEn}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      nivel="terciario"
                      tamano="sm"
                      icono={<Eye className="h-4 w-4" />}
                      onClick={() => setDocVistaPrevia(doc)}
                    >
                      Ver
                    </Button>
                    <Button
                      nivel="terciario"
                      tamano="sm"
                      icono={<Trash2 className="h-4 w-4 text-rd-coral" />}
                      onClick={() => handleEliminarDocumento(doc.id)}
                      aria-label={`Eliminar ${doc.nombre}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal de Vista Previa / Lightbox */}
        {docVistaPrevia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-rd-ink/50 p-4 backdrop-blur-xs font-rd"
            onClick={() => setDocVistaPrevia(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="flex items-center justify-between border-b border-rd-line px-4 py-3 bg-rd-sunken/50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-rd-navy shrink-0" />
                  <span className="text-rd-13 font-semibold text-rd-ink truncate">
                    {docVistaPrevia.nombre}
                  </span>
                  {docVistaPrevia.categoria && (
                    <span className="rounded-rd-sm border border-rd-navy-line bg-rd-navy-soft px-1.5 py-0.5 text-rd-10 font-bold text-rd-navy">
                      {docVistaPrevia.categoria}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDocVistaPrevia(null)}
                  className="rounded-rd-md p-1.5 text-rd-ink-meta hover:bg-rd-fondo hover:text-rd-ink cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido visor */}
              <div className="flex items-center justify-center p-4 bg-rd-sunken/20 max-h-[70vh] overflow-auto">
                {docVistaPrevia.tipo === 'imagen' ? (
                  <img
                    src={docVistaPrevia.url}
                    alt={docVistaPrevia.nombre}
                    className="max-h-[65vh] w-auto rounded-rd-md object-contain border border-rd-line shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700 mb-3">
                      <FileText className="h-8 w-8" />
                    </div>
                    <b className="text-rd-14 font-semibold text-rd-ink mb-1">{docVistaPrevia.nombre}</b>
                    <p className="text-rd-12 text-rd-ink-meta mb-4">Documento en formato PDF ({docVistaPrevia.peso || 'Archivo'})</p>
                    <a
                      href={docVistaPrevia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-rd-md bg-rd-navy px-4 py-2 text-rd-12 font-semibold text-white shadow-xs hover:bg-rd-navy-hover"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir PDF en nueva pestaña
                    </a>
                  </div>
                )}
              </div>

              {/* Footer modal */}
              <div className="flex items-center justify-between border-t border-rd-line px-4 py-2.5 bg-rd-fondo text-rd-11 text-rd-ink-meta">
                <span>Subido el {docVistaPrevia.creadoEn}</span>
                <a
                  href={docVistaPrevia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rd-navy hover:underline font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir enlace original
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Caja>
  );
};
