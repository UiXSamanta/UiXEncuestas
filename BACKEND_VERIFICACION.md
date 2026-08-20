# Verificación de Contraseña en Backend - Documentación

> **Para agentes:** resumen en [`docs/agents/auth-and-permissions.md`](docs/agents/auth-and-permissions.md) y [`docs/agents/domain-admin.md`](docs/agents/domain-admin.md).

## Cambios Realizados

### 1. Backend (`/supabase/functions/server/index.tsx`)

#### Nuevo campo `created_by` en proyectos
- Al crear un proyecto, ahora se guarda el `user_id` del creador en el campo `created_by`
- Esto permite identificar quién creó cada proyecto

#### Nuevo endpoint: `GET /proyectos/:id/check-access`
- **Propósito**: Verificar si el usuario actual necesita contraseña para acceder al proyecto
- **Respuesta**:
```json
{
  "data": {
    "isCreator": true/false,      // true si el usuario es el creador
    "hasPassword": true/false,     // true si el proyecto tiene contraseña
    "requiresPassword": true/false // true si se requiere contraseña (tiene password Y NO es creador)
  },
  "error": null
}
```

#### Endpoint mejorado: `POST /proyectos/:id/validate-password`
- Ahora verifica automáticamente si el usuario es el creador
- Si es el creador, retorna `{ valid: true, isCreator: true }` SIN necesitar contraseña
- Si NO es el creador, valida la contraseña normalmente

### 2. Frontend API (`/src/app/lib/api.ts`)

#### Nueva función: `checkProyectoAccess(id: string)`
```typescript
// Verifica si el usuario actual puede acceder al proyecto sin contraseña
const { data, error } = await api.checkProyectoAccess(projectId);

if (data?.isCreator) {
  // El usuario es el creador, puede acceder directamente
  openProject();
} else if (data?.requiresPassword) {
  // El proyecto requiere contraseña
  showPasswordModal();
} else {
  // Proyecto sin contraseña, acceso libre
  openProject();
}
```

#### Función actualizada: `validateProyectoPassword(id: string, password: string)`
- Ahora envía el token de autorización automáticamente
- Verifica si el usuario es el creador antes de validar la contraseña

## Cómo Actualizar AdminDashboard.tsx

### Opción 1: Verificar acceso al abrir el proyecto

Reemplaza la función `handleOpenProject`:

```typescript
// Open project (check password if needed)
const handleOpenProject = async (proyecto: Proyecto) => {
  // Primero verifica si el usuario necesita contraseña
  const { data, error } = await api.checkProyectoAccess(proyecto.id);

  if (error) {
    console.error('Error checking access:', error);
    return;
  }

  // Si el usuario es el creador O el proyecto no requiere contraseña
  if (data?.isCreator || !data?.requiresPassword) {
    setSelectedProyecto(proyecto);
    setViewMode('project-detail');
    return;
  }

  // Si requiere contraseña, mostrar modal
  setPendingProjectId(proyecto.id);
  setPendingAction('open');
  setShowPasswordModal(true);
};
```

### Opción 2: Mejorar la UI mostrando si el usuario es el creador

1. Agregar estado para rastrear proyectos del usuario:
```typescript
const [userProjects, setUserProjects] = useState<Set<string>>(new Set());
```

2. Al cargar proyectos, verificar cuáles son del usuario:
```typescript
const loadProyectos = async () => {
  const { data, error } = await api.getAllProyectos();
  if (error) {
    console.error('Error loading proyectos:', error);
  }
  
  const proyectosData = data || [];
  setProyectos(proyectosData);

  // Verificar acceso a cada proyecto
  const userProjectIds = new Set<string>();
  for (const proyecto of proyectosData) {
    const { data: accessData } = await api.checkProyectoAccess(proyecto.id);
    if (accessData?.isCreator) {
      userProjectIds.add(proyecto.id);
    }
  }
  setUserProjects(userProjectIds);
};
```

3. Actualizar la UI para mostrar badge de "Creador":
```typescript
{/* En el render del proyecto */}
{userProjects.has(proyecto.id) && (
  <div className="absolute top-4 left-4">
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
      <CheckCircle2 className="w-3 h-3" />
      Creador
    </span>
  </div>
)}
```

## Reglas de Negocio

1. ✅ **Si el proyecto NO tiene contraseña**: Cualquier usuario puede acceder
2. ✅ **Si el proyecto TIENE contraseña Y el usuario ES el creador**: Acceso directo SIN contraseña
3. ✅ **Si el proyecto TIENE contraseña Y el usuario NO es el creador**: Se pide contraseña

## Ejemplos de Uso

### Ejemplo 1: Usuario crea un proyecto con contraseña
```typescript
// Usuario A crea proyecto
const { data: newProject } = await api.createProyecto({
  id: crypto.randomUUID(),
  nombre: 'Mi Proyecto Privado',
  password: 'secreto123',
});

// Usuario A puede acceder SIN contraseña (es el creador)
const { data: access } = await api.checkProyectoAccess(newProject.id);
console.log(access.isCreator); // true
console.log(access.requiresPassword); // false

// Usuario B necesita contraseña para acceder
// (access.isCreator sería false, requiresPassword sería true)
```

### Ejemplo 2: Validación de contraseña inteligente
```typescript
const handleValidatePassword = async () => {
  if (!pendingProjectId) return;

  const { data, error } = await api.validateProyectoPassword(
    pendingProjectId, 
    passwordInput
  );

  if (error || !data?.valid) {
    setPasswordError('Contraseña incorrecta');
    return;
  }

  // Si data.isCreator es true, significa que el usuario es el creador
  // y se le concedió acceso automáticamente
  if (data.isCreator) {
    console.log('✅ Acceso concedido: Eres el creador del proyecto');
  } else {
    console.log('✅ Acceso concedido: Contraseña válida');
  }

  // Continuar con la lógica de acceso...
};
```

## Testing

### Caso de Prueba 1: Creador accede sin contraseña
1. Login como Usuario A
2. Crear proyecto con contraseña "test123"
3. Intentar abrir el proyecto
4. **Resultado esperado**: Abre directamente SIN pedir contraseña

### Caso de Prueba 2: No-creador necesita contraseña
1. Login como Usuario B
2. Intentar abrir proyecto creado por Usuario A (con contraseña)
3. **Resultado esperado**: Muestra modal de contraseña
4. Ingresar contraseña correcta
5. **Resultado esperado**: Abre el proyecto

### Caso de Prueba 3: Proyecto sin contraseña
1. Login como cualquier usuario
2. Intentar abrir proyecto sin contraseña
3. **Resultado esperado**: Abre directamente SIN pedir contraseña

## Notas Importantes

- ⚠️ Los proyectos creados ANTES de esta actualización NO tienen `created_by`, por lo que nadie será identificado como creador
- ⚠️ Para proyectos legacy, se requiere contraseña si la tienen configurada
- ✅ Los proyectos nuevos siempre tendrán el campo `created_by` correctamente asignado
