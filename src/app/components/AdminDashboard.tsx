import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  FileText,
  BarChart3,
  Edit,
  Eye,
  RefreshCw,
  DatabaseZap,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertCircle,
  ShieldCheck,
  Copy,
  Search,
  ArrowUpDown,
  Folder,
  Lock,
  MoreVertical,
  FolderOpen,
  ArrowLeft,
  FolderInput,
} from 'lucide-react';
import * as api from '../lib/api';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { AdminSidebar } from './AdminSidebar';

// Supabase Table Structure: "encuestas" (surveys)
interface Encuesta {
  id: string;
  nombre_encuesta: string;
  estado: boolean;
  conteo_respuestas: number;
  proyecto_id?: string;
  created_at: string;
  updated_at: string;
}

interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

// Get current user from localStorage
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

export function AdminDashboard() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'nombre' | 'fecha'>('nombre');

  // View mode: 'projects' (grid of projects) or 'project-detail' (surveys within a project)
  const [viewMode, setViewMode] = useState<'projects' | 'project-detail'>('projects');
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [unlockedProjects, setUnlockedProjects] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRenameProjectModal, setShowRenameProjectModal] = useState(false);
  const [showDuplicateProjectModal, setShowDuplicateProjectModal] = useState(false);
  const [showMoveToProjectModal, setShowMoveToProjectModal] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [pendingEncuestaId, setPendingEncuestaId] = useState<string | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'open' | 'rename' | 'duplicate' | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPassword, setNewProjectPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // DB Check state
  const [showDbModal, setShowDbModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<FieldCheck[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'ok' | 'error' | 'warning'>('idle');

  const isAdminPrincipal = currentUser.email === 'samanta.camacho@upax.com.mx';

  // Get base path for preview links (includes Figma Make project prefix)
  const getBasePath = () => {
    const path = window.location.pathname;
    const adminIndex = path.indexOf('/admin');
    if (adminIndex !== -1) {
      return path.substring(0, adminIndex);
    }
    return '';
  };

  // Load projects and surveys on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    initializeData();
  }, []);

  // Initialize data - load projects and surveys, create default project if needed
  const initializeData = async () => {
    setIsLoading(true);

    // Load projects
    const { data: proyectosData, error: proyectosError } = await api.getAllProyectos();

    if (proyectosError) {
      console.error('Error loading proyectos:', proyectosError);
    }

    // Load surveys
    const { data: encuestasData, error: encuestasError } = await api.getAllEncuestas();

    if (encuestasError) {
      console.error('Error loading encuestas:', encuestasError);
    }

    const loadedProyectos = proyectosData || [];
    const loadedEncuestas = encuestasData || [];

    // Check if "Primeras encuestas" project exists
    let primerasEncuestasProject = loadedProyectos.find(p => p.nombre === 'Primeras encuestas');

    // If not, create it
    if (!primerasEncuestasProject && loadedEncuestas.length > 0) {
      const newProjectId = crypto.randomUUID();

      const { data: newProject, error: createError } = await api.createProyecto({
        id: newProjectId,
        nombre: 'Primeras encuestas',
        descripcion: 'Proyecto inicial con tus primeras encuestas',
      });

      if (!createError && newProject) {
        primerasEncuestasProject = newProject;
        loadedProyectos.push(newProject);

        // Migrate all existing surveys without proyecto_id to this project
        const surveysToMigrate = loadedEncuestas.filter(e => !e.proyecto_id);
        for (const encuesta of surveysToMigrate) {
          await api.updateEncuesta(encuesta.id, { proyecto_id: newProject.id });
          encuesta.proyecto_id = newProject.id;
        }
      }
    }

    setProyectos(loadedProyectos);
    setEncuestas(loadedEncuestas);
    setIsLoading(false);
  };

  // Load all surveys from API
  const loadEncuestas = async () => {
    const { data, error } = await api.getAllEncuestas();
    if (error) {
      console.error('Error loading encuestas:', error);
    }
    setEncuestas(data || []);
  };

  // Load all projects from API
  const loadProyectos = async () => {
    const { data, error } = await api.getAllProyectos();
    if (error) {
      console.error('Error loading proyectos:', error);
    }
    setProyectos(data || []);
  };

  // Refresh data from Supabase
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await initializeData();
    setIsRefreshing(false);
  };

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('El nombre del proyecto no puede estar vacío');
      return;
    }

    const newId = crypto.randomUUID();

    const { data, error } = await api.createProyecto({
      id: newId,
      nombre: newProjectName,
      password: usePassword ? newProjectPassword : undefined,
    });

    if (error) {
      alert(error);
      return;
    }

    setProyectos([...proyectos, data]);
    setShowCreateProjectModal(false);
    setNewProjectName('');
    setNewProjectPassword('');
    setUsePassword(false);
  };

  // Rename project
  const handleRenameProject = async () => {
    if (!pendingProjectId || !newProjectName.trim()) return;

    const updateData: any = { nombre: newProjectName };

    // Update password if changed
    if (usePassword) {
      updateData.password = newProjectPassword;
      updateData.locked = true;
    } else {
      updateData.password = '';
      updateData.locked = false;
    }

    const { error } = await api.updateProyecto(pendingProjectId, updateData);

    if (error) {
      alert(error);
      return;
    }

    setProyectos(proyectos.map(p => p.id === pendingProjectId ? {
      ...p,
      nombre: newProjectName,
      password: updateData.password,
      locked: updateData.locked
    } : p));
    setShowRenameProjectModal(false);
    setNewProjectName('');
    setNewProjectPassword('');
    setUsePassword(false);
    setPendingProjectId(null);
  };

  // Duplicate project
  const handleDuplicateProject = async () => {
    if (!pendingProjectId || !newProjectName.trim()) return;

    const { data, error } = await api.duplicateProyecto(pendingProjectId, newProjectName);

    if (error) {
      alert(error);
      return;
    }

    setProyectos([...proyectos, data]);
    setShowDuplicateProjectModal(false);
    setNewProjectName('');
    setPendingProjectId(null);
  };

  // Delete project (move to trash)
  const handleDeleteProject = async (proyectoId: string, nombreProyecto: string) => {
    // Check if project has surveys
    const projectSurveys = encuestas.filter(e => e.proyecto_id === proyectoId);

    if (projectSurveys.length > 0) {
      if (!confirm(`El proyecto "${nombreProyecto}" tiene ${projectSurveys.length} encuesta(s). Al eliminarlo, las encuestas también se moverán a la papelera. ¿Continuar?`)) {
        return;
      }
    } else {
      if (!confirm(`¿Mover "${nombreProyecto}" a la papelera? Se eliminará automáticamente después de 15 días.`)) {
        return;
      }
    }

    // Move all surveys to trash first
    for (const survey of projectSurveys) {
      await api.moveToTrash('encuesta', survey.id);
    }

    // Move project to trash
    const { error } = await api.moveToTrash('proyecto', proyectoId);

    if (error) {
      alert('Error al mover a papelera: ' + error);
      return;
    }

    // Update local state
    setProyectos(proyectos.filter(p => p.id !== proyectoId));
    setEncuestas(encuestas.filter(e => e.proyecto_id !== proyectoId));

    // If we're viewing this project, go back to projects view
    if (selectedProyecto?.id === proyectoId) {
      setViewMode('projects');
      setSelectedProyecto(null);
    }
  };

  // Move survey to another project
  const handleMoveToProject = async () => {
    if (!pendingEncuestaId || !targetProjectId) return;

    const { error } = await api.updateEncuesta(pendingEncuestaId, { proyecto_id: targetProjectId });

    if (error) {
      alert('Error al mover encuesta: ' + error);
      return;
    }

    // Update local state
    setEncuestas(encuestas.map(e =>
      e.id === pendingEncuestaId ? { ...e, proyecto_id: targetProjectId } : e
    ));

    setShowMoveToProjectModal(false);
    setPendingEncuestaId(null);
    setTargetProjectId('');
  };

  // Validate project password
  const handleValidatePassword = async () => {
    if (!pendingProjectId) return;

    const { data, error } = await api.validateProyectoPassword(pendingProjectId, passwordInput);

    if (error || !data?.valid) {
      setPasswordError('Contraseña incorrecta');
      return;
    }

    setUnlockedProjects(new Set([...unlockedProjects, pendingProjectId]));
    setPasswordError('');
    setPasswordInput('');

    if (pendingAction === 'open') {
      const proyecto = proyectos.find(p => p.id === pendingProjectId);
      if (proyecto) {
        setSelectedProyecto(proyecto);
        setViewMode('project-detail');
      }
    }

    setShowPasswordModal(false);
    setPendingProjectId(null);
    setPendingAction(null);
  };

  // Open project (check password if needed)
  const handleOpenProject = (proyecto: Proyecto) => {
    if (proyecto.password && !isAdminPrincipal && !unlockedProjects.has(proyecto.id)) {
      setPendingProjectId(proyecto.id);
      setPendingAction('open');
      setShowPasswordModal(true);
      return;
    }

    setSelectedProyecto(proyecto);
    setViewMode('project-detail');
    setSearchTerm('');
  };

  // Go back to projects view
  const handleBackToProjects = () => {
    setViewMode('projects');
    setSelectedProyecto(null);
    setSearchTerm('');
  };

  // Toggle survey status in Supabase
  const toggleEstado = async (encuestaId: string) => {
    const currentEncuesta = encuestas.find(e => e.id === encuestaId);
    if (!currentEncuesta) return;

    const { error } = await api.updateEncuesta(encuestaId, {
      estado: !currentEncuesta.estado
    });
    
    if (error) {
      console.error('Error updating estado:', error);
    }
    
    setEncuestas(encuestas.map(e => 
      e.id === encuestaId ? { ...e, estado: !e.estado } : e
    ));
  };

  // Delete survey (move to trash)
  const handleDeleteEncuesta = async (encuestaId: string, nombreEncuesta: string) => {
    if (!confirm(`¿Mover "${nombreEncuesta}" a la papelera? Se eliminará automáticamente después de 15 días.`)) {
      return;
    }

    const { error } = await api.moveToTrash('encuesta', encuestaId);

    if (error) {
      alert('Error al mover a papelera: ' + error);
      return;
    }

    setEncuestas(encuestas.filter(e => e.id !== encuestaId));
  };

  const handleCreateSurvey = async () => {
    if (!selectedProyecto) return;

    const newId = crypto.randomUUID();

    const newEncuesta = {
      id: newId,
      nombre_encuesta: 'Encuesta Sin Título',
      proyecto_id: selectedProyecto.id,
      pantalla_bienvenida: {
        titulo: 'Bienvenido a Nuestra Encuesta',
        descripcion: 'Tu opinión nos ayuda a mejorar nuestros productos y servicios.',
      },
      configuracion: {
        color_primario: '#2563eb',
        modo_visualizacion: 'scroll',
      },
      preguntas: [],
      estado: false,
      conteo_respuestas: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await api.saveEncuesta(newEncuesta);

    if (error) {
      console.error('Error creating encuesta:', error);
      alert('Error al crear la encuesta: ' + error);
      return;
    }

    navigate(`/builder/${newId}`);
  };

  // Duplicate survey
  const handleDuplicateSurvey = async (encuestaId: string) => {
    // Get the full survey data
    const { data: originalEncuesta, error: fetchError } = await api.getEncuestaById(encuestaId);
    
    if (fetchError || !originalEncuesta) {
      console.error('Error loading encuesta for duplication:', fetchError);
      alert('Error al cargar la encuesta: ' + fetchError);
      return;
    }

    // Create new ID and update metadata
    const newId = crypto.randomUUID();
    const duplicatedEncuesta = {
      ...originalEncuesta,
      id: newId,
      nombre_encuesta: `${originalEncuesta.nombre_encuesta} (Copia)`,
      estado: false, // Always start as draft
      conteo_respuestas: 0, // Reset response count
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase
    const { error: saveError } = await api.saveEncuesta(duplicatedEncuesta);
    
    if (saveError) {
      console.error('Error duplicating encuesta:', saveError);
      alert('Error al duplicar la encuesta: ' + saveError);
      return;
    }

    // Reload the list to show the new survey
    await loadEncuestas();
  };

  // DB field check result
  interface FieldCheck {
    field: string;
    label: string;
    status: 'ok' | 'error' | 'warning' | 'checking';
    value?: string;
    message?: string;
  }

  const handleDbCheck = async () => {
    setShowDbModal(true);
    setIsChecking(true);
    setOverallStatus('idle');

    const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-824603ba`;

    const results: FieldCheck[] = [
      { field: 'server',            label: 'Servidor / Health check',   status: 'checking' },
      { field: 'connection',        label: 'Conexión a base de datos',   status: 'checking' },
      { field: 'id',                label: 'Campo: id (UUID)',           status: 'checking' },
      { field: 'nombre_encuesta',   label: 'Campo: nombre_encuesta',    status: 'checking' },
      { field: 'estado',            label: 'Campo: estado (boolean)',    status: 'checking' },
      { field: 'conteo_respuestas', label: 'Campo: conteo_respuestas',  status: 'checking' },
      { field: 'preguntas',         label: 'Campo: preguntas (JSONB)',   status: 'checking' },
      { field: 'created_at',        label: 'Campo: created_at',         status: 'checking' },
      { field: 'updated_at',        label: 'Campo: updated_at',         status: 'checking' },
      { field: 'write',             label: 'Escritura (POST/PUT)',       status: 'checking' },
    ];

    setCheckResults([...results]);

    const update = (field: string, patch: Partial<FieldCheck>) => {
      results.splice(results.findIndex(r => r.field === field), 1, {
        ...results.find(r => r.field === field)!,
        ...patch,
      });
      setCheckResults([...results]);
    };

    try {
      // 1. Health check
      const healthRes = await fetch(`${API_BASE}/health`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      }).catch(() => null);

      if (healthRes?.ok) {
        update('server', { status: 'ok', value: '200 OK', message: 'Servidor Edge Function activo' });
      } else {
        update('server', { status: 'error', message: `Error ${healthRes?.status ?? 'NETWORK'}` });
      }

      // 2. GET all surveys
      const { data: allData, error: allError } = await api.getAllEncuestas();
      if (allError || !Array.isArray(allData)) {
        update('connection', { status: 'error', message: allError || 'Respuesta inválida' });
        // Mark remaining as error
        ['id','nombre_encuesta','estado','conteo_respuestas','preguntas','created_at','updated_at','write'].forEach(f =>
          update(f, { status: 'error', message: 'No se pudo conectar' })
        );
        setIsChecking(false);
        setOverallStatus('error');
        return;
      }
      update('connection', { status: 'ok', value: `${allData.length} encuesta(s)`, message: 'KV Store accesible' });

      // 3. Pick one record to validate fields (use first available or create temp)
      let sample: any = allData[0] ?? null;

      if (!sample) {
        // Create a temporary record to verify write + fields
        const tempId = `db-check-${Date.now()}`;
        const { data: created, error: createErr } = await api.saveEncuesta({
          id: tempId,
          nombre_encuesta: '__db_check_temp__',
          estado: false,
          conteo_respuestas: 0,
          preguntas: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (createErr || !created) {
          update('write', { status: 'error', message: createErr || 'No se pudo escribir' });
          ['id','nombre_encuesta','estado','conteo_respuestas','preguntas','created_at','updated_at'].forEach(f =>
            update(f, { status: 'warning', message: 'Sin datos para verificar' })
          );
          setIsChecking(false);
          setOverallStatus('warning');
          return;
        }
        update('write', { status: 'ok', message: 'Registro temporal creado' });
        sample = created;
        // Clean up temp record
        await api.deleteEncuesta(tempId);
      } else {
        // Test write with an existing record
        const { error: writeErr } = await api.updateEncuesta(sample.id, { updated_at: new Date().toISOString() });
        if (writeErr) {
          update('write', { status: 'error', message: writeErr });
        } else {
          update('write', { status: 'ok', message: 'PUT ejecutado correctamente' });
        }
      }

      // 4. Verify each field
      const fieldChecks: Array<{ field: string; key: string; validator?: (v: any) => boolean; display?: (v: any) => string }> = [
        { field: 'id',                key: 'id',                validator: v => typeof v === 'string' && v.length > 0, display: v => String(v).slice(0, 16) + '…' },
        { field: 'nombre_encuesta',   key: 'nombre_encuesta',   validator: v => typeof v === 'string', display: v => `"${String(v).slice(0, 24)}"` },
        { field: 'estado',            key: 'estado',            validator: v => typeof v === 'boolean', display: v => String(v) },
        { field: 'conteo_respuestas', key: 'conteo_respuestas', validator: v => typeof v === 'number', display: v => String(v) },
        { field: 'preguntas',         key: 'preguntas',         validator: v => Array.isArray(v), display: v => `Array (${Array.isArray(v) ? v.length : '?'} items)` },
        { field: 'created_at',        key: 'created_at',        validator: v => typeof v === 'string' && v.length > 0, display: v => new Date(v).toLocaleString('es-MX') },
        { field: 'updated_at',        key: 'updated_at',        validator: v => typeof v === 'string' && v.length > 0, display: v => new Date(v).toLocaleString('es-MX') },
      ];

      for (const { field, key, validator, display } of fieldChecks) {
        const val = sample[key];
        const exists = val !== undefined && val !== null;
        const valid = exists && (validator ? validator(val) : true);
        if (valid) {
          update(field, { status: 'ok', value: display ? display(val) : String(val), message: 'Campo presente y tipo correcto' });
        } else if (exists) {
          update(field, { status: 'warning', value: String(val), message: `Tipo inesperado: ${typeof val}` });
        } else {
          update(field, { status: 'error', message: 'Campo ausente o nulo' });
        }
      }

      const hasError = results.some(r => r.status === 'error');
      const hasWarning = results.some(r => r.status === 'warning');
      setOverallStatus(hasError ? 'error' : hasWarning ? 'warning' : 'ok');
    } catch (err: any) {
      console.error('DB check failed:', err);
      results.forEach(r => {
        if (r.status === 'checking') update(r.field, { status: 'error', message: err.message });
      });
      setOverallStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#EBEEF4] dark:bg-muted">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Projects View */}
          {viewMode === 'projects' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-semibold text-[#303C48] dark:text-foreground">Proyectos</h2>
                  <p className="text-sm text-[#81878E] dark:text-muted-foreground mt-1">Organiza tus encuestas por proyectos</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDbCheck}
                    className="flex items-center gap-2 px-4 py-2 text-[#303C48] dark:text-foreground bg-white dark:bg-card border border-[#C3C5C9] dark:border-border rounded-lg hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors"
                    title="Verificar conexión y campos de la base de datos"
                  >
                    <DatabaseZap className="w-4 h-4 text-[#8C59FE]" />
                    Verificar BD
                  </button>
                  <button
                    onClick={() => navigate('/trash')}
                    className="hidden flex items-center gap-2 px-4 py-2 text-[#303C48] dark:text-foreground bg-white dark:bg-card border border-[#C3C5C9] dark:border-border rounded-lg hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Papelera
                  </button>
                  <button
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 text-[#303C48] dark:text-foreground bg-white dark:bg-card border border-[#C3C5C9] dark:border-border rounded-lg hover:bg-[#EBEEF4] dark:hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-[#597AFF] to-[#8C59FE] rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Proyecto
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#81878E] dark:text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar proyectos o encuestas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-[#C3C5C9] dark:border-border rounded-lg bg-white dark:bg-card text-[#303C48] dark:text-foreground placeholder-[#81878E] dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#597AFF] focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#81878E] dark:text-muted-foreground hover:text-[#303C48] dark:hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-12 text-center">
                  <RefreshCw className="w-8 h-8 text-[#81878E] dark:text-muted-foreground animate-spin mx-auto mb-3" />
                  <p className="text-[#5C6671] dark:text-muted-foreground">Cargando proyectos...</p>
                </div>
              ) : proyectos.length === 0 ? (
                <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-12 text-center">
                  <Folder className="w-12 h-12 text-[#81878E] dark:text-muted-foreground mx-auto mb-3" />
                  <p className="text-[#5C6671] dark:text-muted-foreground mb-4">No hay proyectos todavía</p>
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="text-[#597AFF] hover:text-[#8C59FE] font-medium"
                  >
                    Crear tu primer proyecto
                  </button>
                </div>
              ) : (
                <>
                  {(() => {
                    const filteredProyectos = proyectos.filter(p => {
                      const matchesProjectName = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                      const projectSurveys = encuestas.filter(e => e.proyecto_id === p.id);
                      const matchesSurveyName = projectSurveys.some(e =>
                        e.nombre_encuesta.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      return matchesProjectName || matchesSurveyName;
                    });

                    if (filteredProyectos.length === 0 && searchTerm) {
                      return (
                        <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-12 text-center">
                          <Search className="w-12 h-12 text-[#81878E] dark:text-muted-foreground mx-auto mb-3" />
                          <p className="text-[#5C6671] dark:text-muted-foreground mb-2">No se encontraron resultados</p>
                          <p className="text-sm text-[#81878E] dark:text-muted-foreground">Intenta con otro término de búsqueda</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProyectos.map((proyecto) => {
                    const surveyCount = encuestas.filter(e => e.proyecto_id === proyecto.id).length;
                    const hasPassword = !!proyecto.password;
                    const showMenu = openMenuId === proyecto.id;

                    return (
                      <div
                        key={proyecto.id}
                        className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-6 hover:shadow-lg transition-all relative group"
                      >
                        {/* Lock Icon */}
                        {hasPassword && !isAdminPrincipal && (
                          <div className="absolute top-4 right-4">
                            <Lock className="w-4 h-4 text-[#81878E] dark:text-muted-foreground" />
                          </div>
                        )}

                        {/* Project Icon */}
                        <div
                          className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#597AFF] to-[#8C59FE] flex items-center justify-center mb-4 cursor-pointer"
                          onClick={() => handleOpenProject(proyecto)}
                        >
                          <Folder className="w-6 h-6 text-white" />
                        </div>

                        {/* Project Info */}
                        <div
                          className="mb-4 cursor-pointer"
                          onClick={() => handleOpenProject(proyecto)}
                        >
                          <h3 className="text-lg font-semibold text-[#303C48] dark:text-foreground mb-1">{proyecto.nombre}</h3>
                          <p className="text-sm text-[#81878E] dark:text-muted-foreground">{surveyCount} encuesta{surveyCount !== 1 ? 's' : ''}</p>
                        </div>

                        {/* Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(showMenu ? null : proyecto.id)}
                            className="absolute bottom-0 right-0 p-2 text-[#81878E] dark:text-muted-foreground hover:text-[#303C48] dark:hover:text-foreground rounded-lg hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showMenu && (
                            <div className="absolute bottom-10 right-0 bg-white dark:bg-card border border-[#C3C5C9] dark:border-border rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setPendingProjectId(proyecto.id);
                                  setNewProjectName(proyecto.nombre);
                                  setNewProjectPassword(proyecto.password || '');
                                  setUsePassword(!!proyecto.password);
                                  setShowRenameProjectModal(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-[#303C48] dark:text-foreground hover:bg-[#EBEEF4] dark:hover:bg-accent flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setPendingProjectId(proyecto.id);
                                  setNewProjectName(proyecto.nombre + ' (Copia)');
                                  setShowDuplicateProjectModal(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-[#303C48] dark:text-foreground hover:bg-[#EBEEF4] dark:hover:bg-accent flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicar
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteProject(proyecto.id, proyecto.nombre);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* Project Detail View (Surveys within a project) */}
          {viewMode === 'project-detail' && selectedProyecto && (
            <>
              {/* Header with Back Button */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToProjects}
                    className="p-2 text-[#81878E] dark:text-muted-foreground hover:text-[#303C48] dark:hover:text-foreground hover:bg-white dark:hover:bg-accent rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-semibold text-[#303C48] dark:text-foreground flex items-center gap-2">
                      <FolderOpen className="w-8 h-8 text-[#597AFF]" />
                      {selectedProyecto.nombre}
                    </h2>
                    <p className="text-sm text-[#81878E] dark:text-muted-foreground mt-1">
                      {encuestas.filter(e => e.proyecto_id === selectedProyecto.id).length} encuesta(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 text-[#303C48] dark:text-foreground bg-white dark:bg-card border border-[#C3C5C9] dark:border-border rounded-lg hover:bg-[#EBEEF4] dark:hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                  <button
                    onClick={handleCreateSurvey}
                    className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-[#597AFF] to-[#8C59FE] rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Nueva Encuesta
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#81878E] dark:text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar encuestas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-[#C3C5C9] dark:border-border rounded-lg bg-white dark:bg-card text-[#303C48] dark:text-foreground placeholder-[#81878E] dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#597AFF] focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#81878E] dark:text-muted-foreground hover:text-[#303C48] dark:hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Surveys List */}
              {(() => {
                let projectSurveys = encuestas.filter(e =>
                  e.proyecto_id === selectedProyecto.id &&
                  e.nombre_encuesta.toLowerCase().includes(searchTerm.toLowerCase())
                );

                // Sort surveys
                projectSurveys = [...projectSurveys].sort((a, b) => {
                  if (sortBy === 'nombre') {
                    const comparison = a.nombre_encuesta.localeCompare(b.nombre_encuesta);
                    return sortOrder === 'asc' ? comparison : -comparison;
                  } else {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                  }
                });

                if (projectSurveys.length === 0 && !searchTerm) {
                  return (
                    <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-12 text-center">
                      <FileText className="w-12 h-12 text-[#81878E] dark:text-muted-foreground mx-auto mb-3" />
                      <p className="text-[#5C6671] dark:text-muted-foreground mb-4">No hay encuestas en este proyecto</p>
                      <button
                        onClick={handleCreateSurvey}
                        className="text-[#597AFF] hover:text-[#8C59FE] font-medium"
                      >
                        Crear tu primera encuesta
                      </button>
                    </div>
                  );
                }

                if (projectSurveys.length === 0 && searchTerm) {
                  return (
                    <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border p-12 text-center">
                      <Search className="w-12 h-12 text-[#81878E] dark:text-muted-foreground mx-auto mb-3" />
                      <p className="text-[#5C6671] dark:text-muted-foreground mb-2">No se encontraron encuestas</p>
                      <p className="text-sm text-[#81878E] dark:text-muted-foreground">Intenta con otro término de búsqueda</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white dark:bg-card rounded-lg border border-[#C3C5C9] dark:border-border overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-[#EBEEF4] dark:bg-muted border-b border-[#C3C5C9] dark:border-border">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => {
                                if (sortBy === 'nombre') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('nombre');
                                  setSortOrder('asc');
                                }
                              }}
                              className="flex items-center gap-2 text-xs font-medium text-[#5C6671] dark:text-muted-foreground uppercase tracking-wider hover:text-[#303C48] dark:hover:text-foreground transition-colors"
                            >
                              Nombre de Encuesta
                              <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'nombre' ? 'text-[#597AFF]' : ''}`} />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => {
                                if (sortBy === 'fecha') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('fecha');
                                  setSortOrder('desc');
                                }
                              }}
                              className="flex items-center gap-2 text-xs font-medium text-[#5C6671] dark:text-muted-foreground uppercase tracking-wider hover:text-[#303C48] dark:hover:text-foreground transition-colors"
                            >
                              Fecha de Creación
                              <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'fecha' ? 'text-[#597AFF]' : ''}`} />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#5C6671] dark:text-muted-foreground uppercase tracking-wider">
                            Respuestas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#5C6671] dark:text-muted-foreground uppercase tracking-wider">
                            Acciones
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#5C6671] dark:text-muted-foreground uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-card divide-y divide-[#C3C5C9] dark:divide-border">
                        {projectSurveys.map((encuesta) => (
                          <tr key={encuesta.id} className="hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-[#303C48] dark:text-foreground">
                              {encuesta.nombre_encuesta}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-[#5C6671] dark:text-muted-foreground">
                                {new Date(encuesta.created_at).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-[#81878E] dark:text-muted-foreground">
                                {new Date(encuesta.created_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 flex justify-center items-center">
                              <span className="text-2xl font-bold text-[#303C48] dark:text-foreground">
                                {encuesta.conteo_respuestas}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => navigate(`/builder/${encuesta.id}`)}
                                  className="text-[#81878E] dark:text-muted-foreground hover:text-[#597AFF] transition-colors"
                                  title="Editar Encuesta"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => navigate(`/analytics/${encuesta.id}`)}
                                  className="text-[#81878E] dark:text-muted-foreground hover:text-[#8C59FE] transition-colors"
                                  title="Ver Analytics"
                                >
                                  <BarChart3 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateSurvey(encuesta.id)}
                                  className="text-[#81878E] dark:text-muted-foreground hover:text-[#00C4B3] transition-colors"
                                  title="Duplicar Encuesta"
                                >
                                  <Copy className="w-5 h-5" />
                                </button>
                                {proyectos.length > 1 && (
                                  <button
                                    onClick={() => {
                                      setPendingEncuestaId(encuesta.id);
                                      setShowMoveToProjectModal(true);
                                    }}
                                    className="text-[#81878E] dark:text-muted-foreground hover:text-[#FDC700] transition-colors"
                                    title="Mover a otro proyecto"
                                  >
                                    <FolderInput className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteEncuesta(encuesta.id, encuesta.nombre_encuesta)}
                                  className="text-[#81878E] dark:text-muted-foreground hover:text-red-600 transition-colors"
                                  title="Eliminar Encuesta"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleEstado(encuesta.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  encuesta.estado ? 'bg-gradient-to-r from-[#00C4B3] to-[#ACE738]' : 'bg-[#C3C5C9]'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-card transition-transform ${
                                    encuesta.estado ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="ml-2 text-xs font-medium text-[#5C6671] dark:text-muted-foreground">
                                {encuesta.estado ? 'Activa' : 'Borrador'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Nuevo Proyecto</h3>
              <button
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setNewProjectName('');
                  setNewProjectPassword('');
                  setUsePassword(false);
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mi Proyecto"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                  autoFocus
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-4 h-4 text-[#597AFF] border-gray-300 dark:border-border rounded focus:ring-[#597AFF]"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Proteger con contraseña</span>
                </label>
              </div>
              {usePassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={newProjectPassword}
                    onChange={(e) => setNewProjectPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setNewProjectName('');
                  setNewProjectPassword('');
                  setUsePassword(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {showRenameProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Editar Proyecto</h3>
              <button
                onClick={() => {
                  setShowRenameProjectModal(false);
                  setNewProjectName('');
                  setNewProjectPassword('');
                  setUsePassword(false);
                  setPendingProjectId(null);
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                  autoFocus
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-border text-[#597AFF] focus:ring-[#597AFF]"
                  />
                  <Lock className="w-4 h-4" />
                  Proteger con contraseña
                </label>
                {usePassword && (
                  <input
                    type="text"
                    value={newProjectPassword}
                    onChange={(e) => setNewProjectPassword(e.target.value)}
                    placeholder="Ingrese la contraseña"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                  />
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRenameProjectModal(false);
                  setNewProjectName('');
                  setNewProjectPassword('');
                  setUsePassword(false);
                  setPendingProjectId(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameProject}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Project Modal */}
      {showDuplicateProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Duplicar Proyecto</h3>
              <button
                onClick={() => {
                  setShowDuplicateProjectModal(false);
                  setNewProjectName('');
                  setPendingProjectId(null);
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Nombre del Proyecto Duplicado</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateProjectModal(false);
                  setNewProjectName('');
                  setPendingProjectId(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicateProject}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Duplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#597AFF]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Proyecto Protegido</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError('');
                  setPendingProjectId(null);
                  setPendingAction(null);
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">Este proyecto está protegido con contraseña. Ingresa la contraseña para continuar.</p>
              <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Contraseña</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValidatePassword();
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  passwordError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-border focus:ring-[#597AFF]'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError('');
                  setPendingProjectId(null);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidatePassword}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Project Modal */}
      {showMoveToProjectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Mover a otro proyecto</h3>
              <button
                onClick={() => {
                  setShowMoveToProjectModal(false);
                  setPendingEncuestaId(null);
                  setTargetProjectId('');
                }}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">Selecciona el proyecto destino</label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                autoFocus
              >
                <option value="">-- Selecciona un proyecto --</option>
                {proyectos
                  .filter(p => p.id !== selectedProyecto?.id)
                  .map(proyecto => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveToProjectModal(false);
                  setPendingEncuestaId(null);
                  setTargetProjectId('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoveToProject}
                disabled={!targetProjectId}
                className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB Check Modal */}
      {showDbModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  overallStatus === 'ok' ? 'bg-green-100' :
                  overallStatus === 'error' ? 'bg-red-100' :
                  overallStatus === 'warning' ? 'bg-yellow-100' :
                  'bg-purple-100'
                }`}>
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  ) : overallStatus === 'ok' ? (
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  ) : overallStatus === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : overallStatus === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <DatabaseZap className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-foreground">Verificación de Base de Datos</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {isChecking ? 'Comprobando campos...' :
                     overallStatus === 'ok' ? 'Todos los campos verificados correctamente' :
                     overallStatus === 'error' ? 'Se encontraron errores de conexión' :
                     overallStatus === 'warning' ? 'Verificado con advertencias' :
                     'Listo para verificar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Check Results */}
            <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {checkResults.map((check) => (
                <div
                  key={check.field}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    check.status === 'ok'       ? 'bg-green-50 border-green-200' :
                    check.status === 'error'    ? 'bg-red-50 border-red-200' :
                    check.status === 'warning'  ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 dark:bg-background border-gray-200 dark:border-border'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {check.status === 'checking' ? (
                      <Loader2 className="w-4 h-4 text-gray-400 dark:text-muted-foreground animate-spin" />
                    ) : check.status === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : check.status === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-foreground">{check.label}</span>
                      {check.value && (
                        <span className="text-xs font-mono text-gray-500 dark:text-muted-foreground bg-white dark:bg-card border border-gray-200 dark:border-border px-2 py-0.5 rounded shrink-0">
                          {check.value}
                        </span>
                      )}
                    </div>
                    {check.message && (
                      <p className={`text-xs mt-0.5 ${
                        check.status === 'ok'      ? 'text-green-700' :
                        check.status === 'error'   ? 'text-red-600' :
                        check.status === 'warning' ? 'text-yellow-700' :
                        'text-gray-500 dark:text-muted-foreground'
                      }`}>
                        {check.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
              <div className="text-xs text-gray-400 dark:text-muted-foreground font-mono">
                KV Store · Supabase Edge Functions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDbCheck}
                  disabled={isChecking}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  Re-verificar
                </button>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}