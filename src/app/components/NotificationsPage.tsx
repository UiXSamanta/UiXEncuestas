import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RefreshCw, Bell, CheckCheck, Trash2, Loader2, BellOff, UserPlus, Check, X, Mail } from 'lucide-react';
import * as api from '../lib/api';
import { AdminSidebar } from './AdminSidebar';

interface Notification {
  id: string;
  type: 'admin_request' | string;
  nombre: string;
  apellidos: string;
  email: string;
  motivo: string;
  leido: boolean;
  status: 'pending' | 'approved' | 'rejected';
  processed_at?: string;
  processed_by?: string;
  created_at: string;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    const { data, error } = await api.getNotifications();
    if (error) {
      console.error('Error loading notifications:', error);
    }
    // Sort: unread first, then newest
    const sorted = (data || []).sort((a: Notification, b: Notification) => {
      if (a.leido !== b.leido) return a.leido ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setNotifications(sorted);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await api.markNotificationRead(id);
    if (error) {
      console.error('Error marking as read:', error);
      return;
    }
    setNotifications(notifications.map(n => n.id === id ? { ...n, leido: true } : n));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    const { error } = await api.deleteNotification(id);
    if (error) {
      console.error('Error deleting notification:', error);
      return;
    }
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleApprove = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    const confirmMsg = `¿Aprobar solicitud de acceso para ${notif.nombre} ${notif.apellidos}?\n\nSe creará un usuario nuevo y se le enviará un email con sus credenciales.`;
    if (!confirm(confirmMsg)) return;

    setProcessingId(id);
    const { data, error } = await api.approveAccessRequest(id);

    if (error) {
      console.error('Error approving request:', error);
      alert(`Error al aprobar solicitud: ${error}`);
      setProcessingId(null);
      return;
    }

    console.log('✅ Access request approved:', data);

    // Show generated password to admin
    if (data?.password) {
      setGeneratedPassword(data.password);
      setShowPasswordModal(true);
    }

    // Update notification in list
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, status: 'approved', leido: true } : n
    ));

    setProcessingId(null);
    alert(`✅ Usuario creado exitosamente.\n\nSe envió un email a ${notif.email} con las credenciales de acceso.`);
  };

  const handleReject = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    const confirmMsg = `¿Rechazar solicitud de acceso para ${notif.nombre} ${notif.apellidos}?\n\nSe le enviará un email informándole que contacte a su líder de equipo.`;
    if (!confirm(confirmMsg)) return;

    setProcessingId(id);
    const { data, error } = await api.rejectAccessRequest(id);

    if (error) {
      console.error('Error rejecting request:', error);
      alert(`Error al rechazar solicitud: ${error}`);
      setProcessingId(null);
      return;
    }

    console.log('✅ Access request rejected:', data);

    // Update notification in list
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, status: 'rejected', leido: true } : n
    ));

    setProcessingId(null);
    alert(`✅ Solicitud rechazada.\n\nSe envió un email a ${notif.email} con la información.`);
  };

  const unreadCount = notifications.filter(n => !n.leido).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background">
      <AdminSidebar unreadCount={unreadCount} />

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Contraseña Generada</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setGeneratedPassword('');
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
                Se ha creado el usuario exitosamente. Esta es la contraseña temporal que se envió por email:
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground uppercase tracking-wide">
                    Contraseña Temporal
                  </span>
                  <button
                    onClick={() => {
                      try {
                        // Fallback method for clipboard copy
                        const ta = document.createElement('textarea');
                        ta.value = generatedPassword;
                        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        alert('Contraseña copiada al portapapeles');
                      } catch (err) {
                        alert('Copia manualmente la contraseña: ' + generatedPassword);
                      }
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Copiar
                  </button>
                </div>
                <code className="block text-2xl font-mono font-bold text-gray-900 dark:text-foreground tracking-wider">
                  {generatedPassword}
                </code>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Email enviado al usuario</p>
                    <p>
                      El usuario recibirá un email con esta contraseña y deberá cambiarla en su primer inicio de sesión.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-muted-foreground italic">
                Por seguridad, guarda esta contraseña temporalmente por si el usuario no recibe el email.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setGeneratedPassword('');
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-foreground">Notificaciones</h2>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                {unreadCount > 0
                  ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                  : 'Todo al día'}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-muted-foreground bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-12 text-center">
              <Loader2 className="w-8 h-8 text-gray-400 dark:text-muted-foreground animate-spin mx-auto mb-3" />
              <p className="text-gray-500 dark:text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-12 text-center">
              <BellOff className="w-12 h-12 text-gray-300 dark:text-muted-foreground mx-auto mb-3" />
              <p className="text-gray-500 dark:text-muted-foreground font-medium">No hay notificaciones</p>
              <p className="text-gray-400 dark:text-muted-foreground text-sm mt-1">
                Las solicitudes de acceso de administrador aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-muted border-b border-gray-200 dark:border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider w-[28px]">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                  {notifications.map((notif) => (
                    <tr
                      key={notif.id}
                      className={`hover:bg-gray-50 dark:hover:bg-accent transition-colors ${!notif.leido ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* Unread dot */}
                      <td className="pl-6 py-4">
                        {!notif.leido && (
                          <span className="block w-2 h-2 rounded-full bg-gradient-to-r from-[#597AFF] to-[#8C59FE]" />
                        )}
                      </td>

                      {/* Solicitante */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#597AFF]/20 to-[#8C59FE]/20 flex items-center justify-center shrink-0">
                            <UserPlus className="w-4 h-4 text-[#8C59FE]" />
                          </div>
                          <div>
                            <p className={`text-sm ${notif.leido ? 'font-normal text-gray-700 dark:text-muted-foreground' : 'font-semibold text-gray-900 dark:text-foreground'}`}>
                              {notif.nombre} {notif.apellidos}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-muted-foreground">Solicitud de acceso</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-muted-foreground">{notif.email}</span>
                      </td>

                      {/* Motivo */}
                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-sm text-gray-600 dark:text-muted-foreground truncate" title={notif.motivo}>
                          {notif.motivo}
                        </p>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500 dark:text-muted-foreground">{formatDate(notif.created_at)}</span>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {notif.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Aprobada
                          </span>
                        ) : notif.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <X className="w-3 h-3" />
                            Rechazada
                          </span>
                        ) : notif.leido ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground text-xs font-medium">
                            <CheckCheck className="w-3 h-3" />
                            Leída
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#597AFF]/20 to-[#8C59FE]/20 text-[#8C59FE] text-xs font-medium">
                            <Bell className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {notif.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(notif.id)}
                                disabled={processingId === notif.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Aprobar solicitud"
                              >
                                {processingId === notif.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleReject(notif.id)}
                                disabled={processingId === notif.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Rechazar solicitud"
                              >
                                {processingId === notif.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                Rechazar
                              </button>
                            </>
                          )}
                          {!notif.leido && notif.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-gray-500 dark:text-muted-foreground hover:text-[#8C59FE] transition-colors"
                              title="Marcar como leída"
                            >
                              <CheckCheck className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="text-gray-500 dark:text-muted-foreground hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}