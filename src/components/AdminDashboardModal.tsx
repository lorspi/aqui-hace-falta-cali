import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flag,
  RotateCcw,
  BarChart3,
  List,
  Lock,
  Layers,
  FileText,
  Clock,
  Eye,
  Check,
  Trash2,
  Edit,
} from 'lucide-react';
import { AuditLog, Need, Priority, Report, VerificationStatus } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG, VERIFICATION_CONFIG, formatTimeAgo } from '../utils/formatters';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  needs: Need[];
  reports: Report[];
  auditLogs: AuditLog[];
  onVerifyNeed: (needId: string, updates: Partial<Need>) => Promise<void>;
  onResolveReport: (reportId: string, action: string) => Promise<void>;
  onResetDemoData: () => Promise<void>;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  needs,
  reports,
  auditLogs,
  onVerifyNeed,
  onResolveReport,
  onResetDemoData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'REPORTS' | 'METRICS' | 'ALL' | 'AUDIT'>('PENDING');

  // Selected item for moderation editing
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [editPriority, setEditPriority] = useState<Priority>('HIGH');
  const [editVerifiedBy, setEditVerifiedBy] = useState('Moderación Oficial');
  const [editNotes, setEditNotes] = useState('Información confirmada');

  const pendingNeeds = needs.filter((n) => n.verificationStatus === 'PENDING_VERIFICATION');
  const reportedNeeds = needs.filter(
    (n) => n.verificationStatus === 'REPORTED' || reports.some((r) => r.needId === n.id && r.status === 'PENDING')
  );
  const pendingReports = reports.filter((r) => r.status === 'PENDING');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123' || passwordInput === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta (Usa: admin123)');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-slate-900 text-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Panel de Moderación y Verificación</h2>
              <p className="text-xs text-slate-300">
                Aquí Hace Falta · Gestión e integridad de información en Cali
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
            id="btn-close-admin-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto text-slate-700">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Acceso Moderador</h3>
            <p className="text-xs text-slate-600">
              Ingresa la contraseña de administración para revisar y verficar publicaciones.
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Contraseña de moderador (admin123)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono"
              />
              {authError && <p className="text-xs text-rose-600 font-bold">{authError}</p>}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl text-xs shadow-sm"
              >
                Ingresar al panel
              </button>
            </form>

            <p className="text-[11px] text-slate-400">
              Sugerencia de prueba: usa <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">admin123</code>
            </p>
          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="p-4 md:p-6 space-y-6 text-xs text-slate-800">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Pendientes revisión
                </span>
                <strong className="text-2xl font-black text-amber-900">{pendingNeeds.length}</strong>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Reportes de usuarios
                </span>
                <strong className="text-2xl font-black text-rose-900">{pendingReports.length}</strong>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Verificadas activas
                </span>
                <strong className="text-2xl font-black text-emerald-900">
                  {needs.filter((n) => n.verificationStatus === 'VERIFIED').length}
                </strong>
              </div>

              <div className="bg-slate-100 border border-slate-300 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Total registradas
                </span>
                <strong className="text-2xl font-black text-slate-900">{needs.length}</strong>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'PENDING'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendientes ({pendingNeeds.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('REPORTS')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'REPORTS'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Reportes ({pendingReports.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('METRICS')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'METRICS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Métricas y Análisis</span>
                </button>

                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Todas las necesidades</span>
                </button>

                <button
                  onClick={() => setActiveTab('AUDIT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'AUDIT'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Historial de auditoría</span>
                </button>
              </div>

              <button
                onClick={onResetDemoData}
                className="text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 text-[11px] underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer semilla demo</span>
              </button>
            </div>

            {/* TAB CONTENT: PENDING VERIFICATION QUEUE */}
            {activeTab === 'PENDING' && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Publicaciones pendientes de revisión ({pendingNeeds.length})
                </h4>

                {pendingNeeds.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">¡Todo al día!</p>
                    <p className="text-xs">No hay publicaciones pendientes de revisión en este momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              PENDIENTE
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{need.title}</span>
                          </div>
                          <p className="text-slate-700">{need.description}</p>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                            <span>📍 {need.address} ({need.neighborhood})</span>
                            <span>👤 {need.contactName} ({need.contactPhone || need.contactWhatsapp})</span>
                            <span>🕒 {formatTimeAgo(need.createdAt)}</span>
                          </div>
                        </div>

                        {/* Moderation quick actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              onVerifyNeed(need.id, {
                                verificationStatus: 'VERIFIED',
                                priority: 'HIGH',
                                verifiedBy: 'Moderador Oficial',
                                verificationNotes: 'Aprobado por moderación',
                              })
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Aprobar y Verificar
                          </button>

                          <button
                            onClick={() => {
                              setEditingNeed(need);
                              setEditPriority(need.priority);
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar / Prioridad
                          </button>

                          <button
                            onClick={() =>
                              onVerifyNeed(need.id, {
                                verificationStatus: 'ARCHIVED',
                                status: 'CLOSED',
                              })
                            }
                            className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: USER REPORTS */}
            {activeTab === 'REPORTS' && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Reportes ciudadanos pendientes ({pendingReports.length})
                </h4>

                {pendingReports.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">No hay reportes abiertos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                              REPORTE: {rep.reason}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{rep.needTitle}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{rep.description}</p>
                          <p className="text-[11px] text-slate-500">
                            Enviado por: {rep.reporterContact || 'Ciudadano anónimo'} · {formatTimeAgo(rep.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onResolveReport(rep.id, 'RESOLVE_ARCHIVE')}
                            className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Archivar necesidad reportada
                          </button>

                          <button
                            onClick={() => onResolveReport(rep.id, 'DISMISS')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Desestimar reporte
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: METRICS & ANALYTICS */}
            {activeTab === 'METRICS' && (
              <div className="space-y-5">
                <h4 className="font-bold text-slate-900 text-sm">Resumen táctico de necesidades en Cali</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Demand */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Demanda por tipo de ayuda
                    </h5>
                    <div className="space-y-1.5">
                      {Object.keys(CATEGORY_LABELS).map((cat) => {
                        const count = needs.filter((n) => n.categories.includes(cat as any)).length;
                        if (count === 0) return null;
                        const pct = Math.round((count / needs.length) * 100);

                        return (
                          <div key={cat} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span>
                                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]?.icon}{' '}
                                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]?.label}
                              </span>
                              <strong className="text-slate-900">{count} solicitudes</strong>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priorities Breakdown */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Distribución de prioridad
                    </h5>

                    <div className="space-y-2">
                      {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                        const cnt = needs.filter((n) => n.priority === p).length;
                        const cfg = PRIORITY_CONFIG[p];

                        return (
                          <div key={p} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              <span>{cfg.dot}</span> {cfg.label}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">{cnt} puntos</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ALL NEEDS TABLE */}
            {activeTab === 'ALL' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Registro completo de necesidades ({needs.length})
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Título / Barrio</th>
                        <th className="p-3">Prioridad</th>
                        <th className="p-3">Verificación</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Actualizado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {needs.map((need) => (
                        <tr key={need.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <strong className="block text-slate-900">{need.title}</strong>
                            <span className="text-slate-500">{need.neighborhood} ({need.address})</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_CONFIG[need.priority]?.badgeClass}`}>
                              {PRIORITY_CONFIG[need.priority]?.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${VERIFICATION_CONFIG[need.verificationStatus]?.badgeClass}`}>
                              {VERIFICATION_CONFIG[need.verificationStatus]?.label}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{need.status}</td>
                          <td className="p-3 text-slate-500">{formatTimeAgo(need.updatedAt)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setEditingNeed(need);
                                setEditPriority(need.priority);
                              }}
                              className="text-slate-900 font-bold hover:underline"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AUDIT LOGS */}
            {activeTab === 'AUDIT' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Historial de auditoría y trazabilidad</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                        <span>⚡ {log.action}</span>
                        <span className="text-slate-500 font-normal">{new Date(log.timestamp).toLocaleString('es-CO')}</span>
                      </div>
                      <p className="text-xs text-slate-700">{log.details}</p>
                      <p className="text-[10px] text-slate-400">Moderador: {log.adminEmail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Need Modal Overlay inside Admin */}
        {editingNeed && (
          <div className="fixed inset-0 z-60 bg-slate-900/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Moderar / Editar Prioridad</h3>
              <p className="text-xs text-slate-600 font-medium">{editingNeed.title}</p>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Nivel de Prioridad *</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="CRITICAL">🔴 CRÍTICA - Situación grave e inmediata</option>
                  <option value="HIGH">🟠 ALTA - Requiere atención pronta</option>
                  <option value="MEDIUM">🟡 MEDIA - Importante no urgente</option>
                  <option value="LOW">🟢 BAJA - Apoyo complementario</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Entidad / Fuente verificadora</label>
                <input
                  type="text"
                  value={editVerifiedBy}
                  onChange={(e) => setEditVerifiedBy(e.target.value)}
                  placeholder="Ej: Cruz Roja / Defensa Civil / Moderación"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setEditingNeed(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await onVerifyNeed(editingNeed.id, {
                      priority: editPriority,
                      verificationStatus: 'VERIFIED',
                      verifiedBy: editVerifiedBy,
                    });
                    setEditingNeed(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
