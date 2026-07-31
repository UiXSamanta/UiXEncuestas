import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Settings,
  User,
  Mail,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  X,
  CheckCircle,
  AlertCircle,
  Bell,
  Cog,
  Loader2,
  Copy,
  Key,
  RefreshCw,
} from 'lucide-react';
import * as api from '../lib/api';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimary?: boolean;
  can_access_notifications?: boolean;
  can_access_settings?: boolean;
  must_change_password?: boolean;
  temp_password?: string | null;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminPrincipal = currentUser.email === 'samanta.camacho@upax.com.mx';

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Administrador');
  const [formCanAccessNotifications, setFormCanAccessNotifications] = useState(false);
  const [formCanAccessSettings, setFormCanAccessSettings] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    const accessToken = localStorage.getItem('access_token');
    const { data, error } = await api.getAllAdmins(accessToken || '');

    if (error) {
      setErrorMessage('Error al cargar usuarios: ' + error);
      setIsLoading(false);
      return;
    }

    if (data) {
      const transformedAdmins = data.map((admin: any) => ({
        id: admin.id,
        name: admin.name || admin.email,
        email: admin.email,
        role: admin.role || 'Administrador',
        isPrimary: admin.email === 'samanta.camacho@upax.com.mx',
        can_access_notifications: admin.can_access_notifications === true,
        can_access_settings: admin.can_access_settings === true,
        must_change_password: admin.must_change_password || false,
        temp_password: admin.temp_password || null,
      }));
      setAdmins(transformedAdmins);
    }

    setIsLoading(false);
  };

  const openAddModal = () => {
    setEditingAdmin(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Administrador');
    setFormCanAccessNotifications(false);
    setFormCanAccessSettings(false);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormRole(admin.role);
    setFormCanAccessNotifications(admin.can_access_notifications || false);
    setFormCanAccessSettings(admin.can_access_settings || false);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormError('');
  };

  const handleCopy = (text: string, id: string) => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else {
      fallback();
    }

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Nombre y correo son obligatorios.');
      return;
    }

    if (editingAdmin) {
      const accessToken = localStorage.getItem('access_token');
      const { error } = await api.updateAdmin(editingAdmin.id, {
        name: formName.trim(),
        role: formRole,
        can_access_notifications: formCanAccessNotifications,
        can_access_settings: formCanAccessSettings,
      }, accessToken || '');

      if (error) {
        setFormError('Error al actualizar: ' + error);
        return;
      }

      setSuccessMessage(`Usuario "${formName}" actualizado correctamente.`);
      loadAdmins();
    } else {
      const { data, error } = await api.createAdmin({
        email: formEmail.trim(),
        name: formName.trim(),
        role: formRole,
        can_access_notifications: formCanAccessNotifications,
        can_access_settings: formCanAccessSettings,
      });

      if (error) {
        setFormError('Error al crear usuario: ' + error);
        return;
      }

      // Show the generated temp password
      if (data?.temp_password) {
        setNewTempPassword(data.temp_password);
        setNewUserName(formName.trim());
      }

      loadAdmins();
    }

    closeModal();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleResetPassword = async (admin: Admin) => {
    if (!confirm(`¿Resetear la contraseña de "${admin.name}"? Se le enviará un correo de notificación.`)) return;
    setResettingId(admin.id);
    const accessToken = localStorage.getItem('access_token') ?? '';
    const { data, error } = await api.resetAdminPassword(admin.id, accessToken);
    setResettingId(null);
    if (error) {
      setErrorMessage('Error al resetear contraseña: ' + error);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    setAdmins((prev) =>
      prev.map((a) =>
        a.id === admin.id
          ? { ...a, must_change_password: true, temp_password: data?.temp_password ?? null }
          : a
      )
    );
    setSuccessMessage(`Contraseña de "${admin.name}" reseteada. Nueva contraseña temporal generada.`);
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${admin.name}"?`)) return;

    const accessToken = localStorage.getItem('access_token');
    const { error } = await api.deleteAdmin(admin.id, accessToken || '');

    if (error) {
      setErrorMessage('Error al eliminar usuario: ' + error);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setSuccessMessage(`Usuario "${admin.name}" eliminado.`);
    setTimeout(() => setSuccessMessage(''), 4000);
    loadAdmins();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Settings className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">Configuración de Cuentas</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{currentUser.name || currentUser.email}</span>
            </div>
            {isAdminPrincipal && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar usuario
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-8 max-w-4xl mx-auto">

        {/* Temp password reveal banner */}
        {newTempPassword && (
          <div className="mb-6 p-4 bg-[#597AFF]/5 border border-[#597AFF]/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-[#597AFF] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#303C48] mb-1">
                  Usuario "{newUserName}" creado exitosamente
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Comparte esta contraseña temporal con el usuario. Deberá cambiarla al iniciar sesión por primera vez.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-[#597AFF]/40 rounded-lg text-sm font-mono text-[#303C48] tracking-wider">
                    {newTempPassword}
                  </code>
                  <button
                    onClick={() => handleCopy(newTempPassword, 'new')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#597AFF] bg-white border border-[#597AFF]/40 rounded-lg hover:bg-[#597AFF]/10 transition-colors whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === 'new' ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <button onClick={() => setNewTempPassword('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Admins Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Administradores del sistema</h2>
            <p className="text-xs text-gray-500 mt-0.5">{admins.length} usuario{admins.length !== 1 ? 's' : ''} registrado{admins.length !== 1 ? 's' : ''}</p>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contraseña temporal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permisos</th>
                {isAdminPrincipal && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#8C59FE] animate-spin" />
                      <p className="text-sm text-gray-500">Cargando usuarios...</p>
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : admins.map((admin) => (
                <tr key={admin.id} className={`transition-colors ${admin.isPrimary ? 'bg-[#8C59FE]/5' : 'hover:bg-[#EBEEF4]'}`}>
                  {/* Name + avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${admin.isPrimary ? 'bg-gradient-to-br from-[#597AFF] to-[#8C59FE]' : 'bg-[#81878E]'}`}>
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{admin.name}</span>
                        {admin.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#8C59FE]/10 text-[#8C59FE] text-[10px] font-semibold rounded-full uppercase tracking-wide">
                            <ShieldCheck className="w-3 h-3" />
                            Principal
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{admin.email}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${admin.isPrimary ? 'bg-[#8C59FE]/10 text-[#8C59FE]' : 'bg-gray-100 text-gray-700'}`}>
                      {admin.role}
                    </span>
                  </td>

                  {/* Temp password — visible until user changes it */}
                  <td className="px-6 py-4">
                    {admin.isPrimary ? (
                      <span className="text-xs text-gray-400 italic">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {admin.must_change_password && admin.temp_password ? (
                          <>
                            <code className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                              {admin.temp_password}
                            </code>
                            <button
                              onClick={() => handleCopy(admin.temp_password!, admin.id)}
                              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                              title="Copiar contraseña"
                            >
                              {copiedId === admin.id ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Cambiada
                          </span>
                        )}
                        {isAdminPrincipal && (
                          <button
                            onClick={() => handleResetPassword(admin)}
                            disabled={resettingId === admin.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#597AFF] bg-[#597AFF]/10 hover:bg-[#597AFF]/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Resetear contraseña"
                          >
                            {resettingId === admin.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Permissions */}
                  <td className="px-6 py-4">
                    {admin.isPrimary ? (
                      <span className="text-xs text-gray-500 italic">Acceso completo</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {admin.can_access_notifications && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                            <Bell className="w-3 h-3" />
                            Notif
                          </span>
                        )}
                        {admin.can_access_settings && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-full">
                            <Cog className="w-3 h-3" />
                            Config
                          </span>
                        )}
                        {!admin.can_access_notifications && !admin.can_access_settings && (
                          <span className="text-xs text-gray-400 italic">Sin permisos</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions — solo admin principal */}
                  {isAdminPrincipal && (
                    <td className="px-6 py-4">
                      {admin.isPrimary ? (
                        <span className="text-xs text-gray-400 italic">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5C6671] bg-white border border-[#C3C5C9] rounded-lg hover:bg-[#EBEEF4] hover:border-[#8C59FE] hover:text-[#8C59FE] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            La contraseña temporal es visible hasta que el usuario la cambie al iniciar sesión por primera vez. Compártela de forma segura.
          </p>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {editingAdmin ? 'Editar usuario' : 'Agregar usuario'}
              </h3>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {!editingAdmin && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Contraseña automática:</strong> Se generará una contraseña temporal que deberás compartir con el usuario. El usuario deberá cambiarla al iniciar sesión.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nombre Apellido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={!!editingAdmin}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option>Administrador</option>
                  <option>Editor</option>
                  <option>Visualizador</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Permisos de acceso</label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCanAccessNotifications}
                      onChange={(e) => setFormCanAccessNotifications(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#8C59FE] focus:ring-[#8C59FE] cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span>Acceso a Notificaciones</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCanAccessSettings}
                      onChange={(e) => setFormCanAccessSettings(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#8C59FE] focus:ring-[#8C59FE] cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Cog className="w-4 h-4 text-gray-500" />
                      <span>Acceso a Configuración</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#597AFF] to-[#8C59FE] rounded-lg hover:shadow-lg transition-all">
                {editingAdmin ? 'Guardar cambios' : 'Agregar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
