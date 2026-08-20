import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { supabase } from './supabase';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-824603ba`;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Fresh access token from Supabase session, synced to localStorage. */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    localStorage.setItem('access_token', token);
    return token;
  }
  return localStorage.getItem('access_token') ?? '';
}

function parseApiResponseBody(text: string, status: number, endpoint: string): ApiResponse<unknown> | null {
  if (!text.trim()) return null;

  const looksJson = text.trimStart().startsWith('{') || text.trimStart().startsWith('[');
  if (!looksJson) {
    const errMsg = status === 404
      ? 'Endpoint no disponible (404). Verifica el deploy de Supabase.'
      : text || `Error del servidor (${status})`;
    console.error(`API Error [${endpoint}]:`, errMsg);
    return { data: null, error: errMsg };
  }

  try {
    return JSON.parse(text) as ApiResponse<unknown>;
  } catch {
    const errMsg = status === 404
      ? 'Endpoint no disponible (404). Verifica el deploy de Supabase.'
      : `Respuesta inválida del servidor (${status})`;
    console.error(`API Parse Error [${endpoint}]:`, errMsg, text.slice(0, 120));
    return { data: null, error: errMsg };
  }
}

// Helper function for API calls
type AuthMode = 'required' | 'optional' | 'public';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  authMode: AuthMode = 'required'
): Promise<ApiResponse<T>> {
  try {
    const extraHeaders = options.headers as Record<string, string | null | undefined> | undefined;
    const mergedHeaders: Record<string, string> = {
      'apikey': publicAnonKey,
    };

    if (!(options.body instanceof FormData)) {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    if (authMode === 'public') {
      mergedHeaders['Authorization'] = `Bearer ${publicAnonKey}`;
    } else {
      const token = await getAccessToken();
      if (authMode === 'required' && !token) {
        return { data: null, error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.' };
      }
      mergedHeaders['Authorization'] = `Bearer ${token || publicAnonKey}`;
    }

    if (extraHeaders) {
      for (const [key, val] of Object.entries(extraHeaders)) {
        if (val != null) mergedHeaders[key] = val;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: mergedHeaders,
    });

    const text = await response.text();
    const parsed = parseApiResponseBody(text, response.status, endpoint);

    if (!parsed) {
      if (!response.ok) {
        const errMsg = response.status === 404
          ? 'Endpoint no disponible (404). Verifica el deploy de Supabase.'
          : `HTTP ${response.status}`;
        return { data: null, error: errMsg };
      }
      return { data: null, error: null };
    }

    const data = parsed as ApiResponse<T>;

    if (!response.ok) {
      const errMsg = data?.error || (parsed as { message?: string }).message || `HTTP ${response.status}`;
      console.error(`API Error [${endpoint}]:`, errMsg, data);
      return { data: null, error: errMsg || 'Error en la solicitud' };
    }

    return data;
  } catch (error) {
    console.error(`Network Error [${endpoint}]:`, error);
    return { data: null, error: 'Error de conexión con el servidor' };
  }
}

// ==================== ENCUESTAS API ====================

export async function getAllEncuestas() {
  return fetchApi<any[]>('/encuestas', {
    method: 'GET',
  });
}

export async function getEncuestaById(id: string) {
  return fetchApi<any>(`/encuestas/${id}`, {
    method: 'GET',
  }, 'optional');
}

export async function saveEncuesta(encuesta: any) {
  return fetchApi<any>('/encuestas', {
    method: 'POST',
    body: JSON.stringify(encuesta),
  });
}

export async function updateEncuesta(id: string, updates: any) {
  return fetchApi<any>(`/encuestas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteEncuesta(id: string) {
  return fetchApi<any>(`/encuestas/${id}`, {
    method: 'DELETE',
  });
}

// ==================== RESPUESTAS API ====================

export async function saveRespuesta(encuesta_id: string, respuestas: any) {
  return fetchApi<any>('/respuestas', {
    method: 'POST',
    body: JSON.stringify({ encuesta_id, respuestas }),
  }, 'public');
}

export async function getRespuestasByEncuesta(encuesta_id: string) {
  return fetchApi<any[]>(`/respuestas/${encuesta_id}`, {
    method: 'GET',
  });
}

export async function deleteRespuestasByEncuesta(encuesta_id: string) {
  return fetchApi<any>(`/respuestas/${encuesta_id}`, {
    method: 'DELETE',
  });
}

// ==================== AUTH API ====================

export async function signUp(email: string, password: string, name: string) {
  return fetchApi<any>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data.session, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: true, error: null };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data.session, error: null };
}

export async function verifyUser() {
  return fetchApi<any>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getAllAdmins(_accessToken?: string) {
  return fetchApi<any[]>('/auth/admins', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function createAdmin(adminData: {
  email: string;
  name: string;
  role?: string;
  can_access_notifications?: boolean;
  can_access_settings?: boolean;
}) {
  return fetchApi<any>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(adminData),
  });
}

export async function updateAdmin(adminId: string, updates: {
  name?: string;
  role?: string;
  can_access_notifications?: boolean;
  can_access_settings?: boolean;
}, _accessToken?: string) {
  return fetchApi<any>(`/auth/admins/${adminId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function resetAdminPassword(adminId: string, _accessToken?: string) {
  return fetchApi<{ temp_password: string }>(`/auth/admins/${adminId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteAdmin(adminId: string, _accessToken?: string) {
  return fetchApi<any>(`/auth/admins/${adminId}`, {
    method: 'DELETE',
    body: JSON.stringify({}),
  });
}

export async function importAdminsCsv(
  rows: Array<Record<string, unknown>>,
  _accessToken?: string,
) {
  return fetchApi<{
    created: Array<{ id: string; email: string; name: string; temp_password?: string }>;
    updated: Array<{ id: string; email: string; name: string }>;
    skipped: Array<{ email: string; reason: string }>;
    errors: string[];
  }>('/auth/admins/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

export async function setupInitialAdmin() {
  return { data: null, error: 'El endpoint de setup-admin fue eliminado. Crea el primer admin en el dashboard de Supabase.' };
}

// ==================== IMAGE UPLOAD ====================

export async function uploadSurveyImage(file: File): Promise<{ data: { url: string } | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || publicAnonKey}`,
        'apikey': publicAnonKey,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error uploading image:', result.error);
      return { data: null, error: result.error || 'Error al subir la imagen' };
    }

    return result;
  } catch (error) {
    console.error('Network error uploading image:', error);
    return { data: null, error: 'Error de conexión al subir la imagen' };
  }
}

// ==================== NOTIFICATIONS API ====================

export async function createNotification(notif: {
  type: string;
  nombre: string;
  apellidos: string;
  email: string;
  motivo: string;
}) {
  return fetchApi<any>('/notifications', {
    method: 'POST',
    body: JSON.stringify(notif),
  }, 'public');
}

export async function getNotifications() {
  return fetchApi<any[]>('/notifications', {
    method: 'GET',
  });
}

export async function markNotificationRead(id: string) {
  return fetchApi<any>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function deleteNotification(id: string) {
  return fetchApi<any>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

export async function approveAccessRequest(notificationId: string) {
  return fetchApi<any>(`/notifications/${notificationId}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function rejectAccessRequest(notificationId: string) {
  return fetchApi<any>(`/notifications/${notificationId}/reject`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function changePassword(newPassword: string) {
  return fetchApi<any>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

// ==================== AI COMPARADOR ====================

export async function compareWithAI(comparacionData: any[]) {
  return fetchApi<any[]>('/ai/compare-surveys', {
    method: 'POST',
    body: JSON.stringify({ comparacionData }),
  });
}

// ==================== PROYECTOS API ====================

export async function getAllProyectos() {
  return fetchApi<any[]>('/proyectos', {
    method: 'GET',
  });
}

export async function getProyectoById(id: string) {
  return fetchApi<any>(`/proyectos/${id}`, {
    method: 'GET',
  });
}

export async function createProyecto(proyecto: any) {
  return fetchApi<any>('/proyectos', {
    method: 'POST',
    body: JSON.stringify(proyecto),
  });
}

export async function updateProyecto(id: string, updates: any) {
  return fetchApi<any>(`/proyectos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteProyecto(id: string) {
  return fetchApi<any>(`/proyectos/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateProyecto(id: string, newName: string) {
  return fetchApi<any>(`/proyectos/${id}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ newName }),
  });
}

export async function checkProyectoAccess(id: string) {
  return fetchApi<any>(`/proyectos/${id}/check-access`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function validateProyectoPassword(id: string, password: string) {
  return fetchApi<any>(`/proyectos/${id}/validate-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function moveToTrash(type: 'proyecto' | 'encuesta', id: string) {
  return fetchApi<any>('/trash', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  });
}

export async function getTrash() {
  return fetchApi<any[]>('/trash', {
    method: 'GET',
  });
}

export async function restoreFromTrash(id: string) {
  return fetchApi<any>(`/trash/${id}/restore`, {
    method: 'POST',
  });
}

export async function permanentlyDelete(id: string) {
  return fetchApi<any>(`/trash/${id}`, {
    method: 'DELETE',
  });
}