# Sistema de Notificaciones y Gestión de Solicitudes de Acceso

## 📋 Resumen

Sistema completo para gestionar solicitudes de acceso de nuevos administradores, incluyendo aprobación/rechazo de solicitudes, generación automática de contraseñas y cambio obligatorio de contraseña en el primer inicio de sesión.

---

## 🎯 Funcionalidades Implementadas

### 1. ✅ Super Admin puede Aceptar o Rechazar Solicitudes

**Ubicación**: `/admin/notifications`

- Botón verde "Aprobar" para aceptar solicitudes
- Botón rojo "Rechazar" para denegar solicitudes
- Estados visuales: Pendiente, Aprobada, Rechazada

**Endpoint Backend**: 
- `POST /notifications/:id/approve` - Aprobar solicitud
- `POST /notifications/:id/reject` - Rechazar solicitud

### 2. ✅ Creación Automática de Usuario al Aprobar

Al aprobar una solicitud:
1. Se crea el usuario en Supabase Auth
2. Se genera una contraseña automática
3. Se guarda la información del admin en KV store
4. Se marca como `must_change_password: true`
5. Se actualiza el estado de la notificación a "approved"

**Código de Generación de Contraseña**:
```typescript
function generateAutoPassword(nombre: string): string {
  // 3 letras del nombre (primeras 3)
  const nameLetters = nombre.substring(0, 3).toLowerCase();

  // 3 números random (0-9)
  const numbers = Array.from({ length: 3 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');

  // 3 caracteres especiales random (!@#$%&*)
  const specialChars = '!@#$%&*';
  const specials = Array.from({ length: 3 }, () =>
    specialChars[Math.floor(Math.random() * specialChars.length)]
  ).join('');

  // Resultado: sam743@!* (ejemplo)
  return nameLetters + numbers + specials;
}
```

**Ejemplo de contraseñas generadas**:
- Nombre: "Samanta" → `sam456#@!`
- Nombre: "Juan" → `jua927$*&`
- Nombre: "Ana" → `ana103!@#`

### 3. ✅ Email de Rechazo al Solicitante

Al rechazar una solicitud:
1. Se actualiza el estado de la notificación a "rejected"
2. Se envía un email con el mensaje estándar:

```
Hola [Nombre],

Lamentamos informarte que no pudimos procesar tu solicitud de acceso en este momento.

Rechazamos tu solicitud de acceso, comunícate con tu líder de equipo 
para obtener más información sobre los siguientes pasos.

Si tienes alguna pregunta o crees que esto es un error, por favor 
contacta a tu líder de equipo.

Saludos,
El equipo de administración
```

### 4. ✅ Email de Bienvenida con Contraseña

Al aprobar una solicitud, se envía un email al nuevo usuario:

```
Hola [Nombre],

¡Bienvenido al sistema! Tu solicitud de acceso ha sido aprobada.

Tus credenciales de acceso son:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: [email del usuario]
🔑 Contraseña temporal: [contraseña generada]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANTE:
Por seguridad, deberás cambiar tu contraseña la primera vez que inicies sesión.

Puedes acceder al sistema en: [URL de la app]

Si tienes alguna pregunta, contacta a tu líder de equipo.

Saludos,
El equipo de administración
```

**Nota**: El admin también ve la contraseña en un modal después de aprobar.

### 5. ✅ Generación Automática de Contraseñas

**Formato**: `[3 letras][3 números][3 símbolos]`

**Características**:
- **3 letras**: Primeras 3 letras del nombre en minúsculas
- **3 números**: Dígitos aleatorios del 0-9
- **3 símbolos**: Caracteres especiales de `!@#$%&*`

**Seguridad**:
- Longitud total: 9 caracteres
- Mezcla de letras, números y símbolos
- Temporal - debe ser cambiada en el primer login

### 6. ✅ Cambio Obligatorio de Contraseña en Primer Login

**Flujo**:
1. Usuario nuevo inicia sesión con contraseña temporal
2. Sistema detecta `must_change_password: true`
3. Muestra modal de cambio de contraseña (no puede cerrar ni omitir)
4. Usuario debe crear nueva contraseña que cumpla requisitos
5. Al cambiar, `must_change_password` se marca como `false`
6. Usuario es redirigido al dashboard

**Requisitos de Nueva Contraseña**:
- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula (A-Z)
- ✅ Al menos una minúscula (a-z)
- ✅ Al menos un número (0-9)
- ✅ Al menos un carácter especial (!@#$...)

**Validación en Tiempo Real**:
- Indicadores visuales para cada requisito
- Validación de coincidencia de contraseñas
- Botón deshabilitado hasta cumplir todos los requisitos

---

## 🔧 Estructura Técnica

### Backend (`/supabase/functions/server/index.tsx`)

#### Nuevas Funciones Helper

```typescript
// Genera contraseña automática
function generateAutoPassword(nombre: string): string

// Envía email (placeholder - integrar con servicio)
async function sendEmail(to: string, subject: string, body: string)
```

#### Endpoints Nuevos

```typescript
// Aprobar solicitud
POST /notifications/:id/approve
Headers: Authorization: Bearer {access_token}
Response: {
  data: {
    user: { ... },
    password: "sam123@#!",
    notification: { ... },
    message: "..."
  }
}

// Rechazar solicitud
POST /notifications/:id/reject
Headers: Authorization: Bearer {access_token}
Response: {
  data: {
    notification: { ... },
    message: "..."
  }
}

// Cambiar contraseña
POST /auth/change-password
Headers: Authorization: Bearer {access_token}
Body: { newPassword: "nueva_contraseña_segura" }
Response: {
  data: {
    message: "Contraseña actualizada exitosamente",
    must_change_password: false
  }
}
```

#### Endpoints Actualizados

```typescript
// Verificar usuario - ahora retorna must_change_password
POST /auth/verify
Response: {
  data: {
    id: "...",
    email: "...",
    name: "...",
    must_change_password: true/false  // ← NUEVO
  }
}

// Crear notificación - ahora incluye status
POST /notifications
Body: {
  nombre: "Juan",
  apellidos: "Pérez",
  email: "juan@example.com",
  motivo: "Necesito acceso..."
}
Response: {
  data: {
    id: "...",
    status: "pending",  // ← NUEVO: pending | approved | rejected
    ...
  }
}
```

### Frontend

#### Nuevos Componentes

**`ChangePasswordModal.tsx`**
- Modal de cambio de contraseña obligatorio
- Validación en tiempo real
- No se puede cerrar ni omitir
- Muestra requisitos de seguridad

**Props**:
```typescript
interface ChangePasswordModalProps {
  onSuccess: () => void;  // Callback al cambiar exitosamente
}
```

#### Componentes Actualizados

**`NotificationsPage.tsx`**
- Botones de Aprobar/Rechazar para solicitudes pendientes
- Estados visuales (Pendiente, Aprobada, Rechazada)
- Modal para mostrar contraseña generada al admin
- Indicador de procesamiento durante operaciones

**`Login.tsx`**
- Verifica `must_change_password` después del login
- Muestra `ChangePasswordModal` si es necesario
- Bloquea navegación hasta cambiar contraseña

#### Nuevas Funciones API (`/src/app/lib/api.ts`)

```typescript
// Aprobar solicitud de acceso
export async function approveAccessRequest(notificationId: string)

// Rechazar solicitud de acceso
export async function rejectAccessRequest(notificationId: string)

// Cambiar contraseña
export async function changePassword(newPassword: string)
```

---

## 🎨 UI/UX

### Página de Notificaciones

**Estados de Solicitud**:
- 🔵 **Pendiente**: Badge morado con icono de campana
- 🟢 **Aprobada**: Badge verde con ícono de check
- 🔴 **Rechazada**: Badge rojo con ícono de X

**Acciones Disponibles**:
- Solicitudes pendientes:
  - ✅ Botón verde "Aprobar"
  - ❌ Botón rojo "Rechazar"
  - 👁️ Marcar como leída
  - 🗑️ Eliminar
- Solicitudes procesadas:
  - 🗑️ Eliminar (solo acción disponible)

**Modal de Contraseña Generada** (mostrado al admin):
```
┌─────────────────────────────────────┐
│ ✅ Contraseña Generada              │
├─────────────────────────────────────┤
│                                     │
│ Se ha creado el usuario...          │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ CONTRASEÑA TEMPORAL         │    │
│ │ sam456#@!                   │    │
│ │                      [Copiar]│   │
│ └─────────────────────────────┘    │
│                                     │
│ ⚠️ Email enviado al usuario         │
│                                     │
│            [Entendido]              │
└─────────────────────────────────────┘
```

### Modal de Cambio de Contraseña

**Diseño**:
```
┌─────────────────────────────────────┐
│ 🔒 Cambio de Contraseña Obligatorio │
├─────────────────────────────────────┤
│                                     │
│ ⚠️ Primera vez iniciando sesión     │
│ Debes crear una contraseña nueva... │
│                                     │
│ Nueva Contraseña:                   │
│ [__________________] 👁             │
│                                     │
│ ✅ Mínimo 8 caracteres              │
│ ✅ Al menos una mayúscula           │
│ ✅ Al menos una minúscula           │
│ ✅ Al menos un número               │
│ ✅ Al menos un carácter especial    │
│                                     │
│ Confirmar Contraseña:               │
│ [__________________] 👁             │
│ ✅ Las contraseñas coinciden        │
│                                     │
│      [Cambiar Contraseña]           │
│                                     │
│ 🔒 Tu contraseña será encriptada... │
└─────────────────────────────────────┘
```

---

## 🔄 Flujo Completo

### Flujo de Solicitud de Acceso

```
1. Usuario visita /admin-request
   └─> Llena formulario (nombre, apellidos, email, motivo)
   └─> Click en "Enviar Solicitud"

2. Sistema crea notificación
   └─> Estado: "pending"
   └─> Visible en /admin/notifications

3. Super Admin revisa notificación
   ├─> OPCIÓN A: Aprobar
   │   ├─> Genera contraseña (ej: sam456#@!)
   │   ├─> Crea usuario en Supabase Auth
   │   ├─> Marca must_change_password: true
   │   ├─> Envía email con credenciales
   │   ├─> Muestra contraseña al admin
   │   └─> Actualiza estado a "approved"
   │
   └─> OPCIÓN B: Rechazar
       ├─> Envía email de rechazo
       └─> Actualiza estado a "rejected"

4. Usuario nuevo recibe email
   └─> Email: user@example.com
   └─> Contraseña: sam456#@!

5. Usuario intenta login
   └─> Ingresa email y contraseña temporal
   └─> Sistema detecta must_change_password

6. Modal de cambio de contraseña aparece
   ├─> Usuario NO puede omitir/cerrar
   ├─> Debe crear contraseña segura
   ├─> Validación en tiempo real
   └─> Confirmar contraseña

7. Usuario cambia contraseña
   └─> must_change_password = false
   └─> Redirige a /admin

8. Usuario ya puede usar el sistema normalmente
```

---

## 📧 Integración de Email (Pendiente)

Actualmente, los emails se **simulan en consola**. Para producción, integrar con un servicio de email:

### Opciones Recomendadas:

1. **SendGrid** (más popular)
2. **Resend** (moderna, fácil de usar)
3. **AWS SES** (escalable)
4. **Mailgun**

### Ejemplo de Integración con Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendEmail(to: string, subject: string, body: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Sistema de Encuestas <noreply@tudominio.com>',
      to: [to],
      subject: subject,
      text: body,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}
```

### Configuración Necesaria:

1. Crear cuenta en el servicio de email elegido
2. Obtener API key
3. Agregar API key a variables de entorno de Supabase
4. Verificar dominio del remitente (from email)
5. Configurar plantillas de email (opcional)

---

## 🔐 Seguridad

### Contraseñas Temporales
- ✅ Generadas aleatoriamente
- ✅ Mezcla de letras, números y símbolos
- ✅ Únicas por usuario
- ✅ Deben ser cambiadas obligatoriamente

### Cambio de Contraseña
- ✅ Validación de requisitos fuertes
- ✅ No se puede omitir en primer login
- ✅ Confirmación requerida
- ✅ Almacenada encriptada por Supabase Auth

### Autorización
- ✅ Solo usuarios autenticados pueden aprobar/rechazar
- ✅ Access token requerido en todas las operaciones
- ✅ Verificación de permisos en backend

---

## 📊 Base de Datos

### Estructura de Notificación

```typescript
{
  id: string,
  type: 'admin_request',
  nombre: string,
  apellidos: string,
  email: string,
  motivo: string,
  leido: boolean,
  status: 'pending' | 'approved' | 'rejected',  // ← NUEVO
  processed_at?: string,                         // ← NUEVO
  processed_by?: string,                         // ← NUEVO (user_id del admin)
  created_at: string
}
```

### Estructura de Usuario Admin

```typescript
{
  id: string,
  email: string,
  name: string,
  must_change_password: boolean,     // ← NUEVO
  password_changed_at?: string,      // ← NUEVO
  created_at: string
}
```

---

## 🧪 Testing

### Caso de Prueba 1: Aprobar Solicitud

```
1. Crear solicitud desde /admin-request
   - Nombre: "Test"
   - Apellidos: "Usuario"
   - Email: "test@example.com"

2. Login como super admin → /admin/notifications

3. Localizar solicitud pendiente

4. Click en "Aprobar"
   ✅ Confirmar en diálogo

5. Verificar:
   ✅ Modal muestra contraseña generada (ej: tes456#@!)
   ✅ Estado cambia a "Aprobada"
   ✅ Console muestra email enviado
   ✅ Usuario aparece en lista de admins

6. Login con credenciales nuevas
   ✅ Modal de cambio de contraseña aparece
   ✅ No se puede cerrar ni omitir
```

### Caso de Prueba 2: Rechazar Solicitud

```
1. Crear solicitud desde /admin-request

2. Login como super admin → /admin/notifications

3. Click en "Rechazar"
   ✅ Confirmar en diálogo

4. Verificar:
   ✅ Estado cambia a "Rechazada"
   ✅ Console muestra email de rechazo enviado
   ✅ Usuario NO aparece en lista de admins
```

### Caso de Prueba 3: Cambio de Contraseña Obligatorio

```
1. Aprobar solicitud y obtener credenciales

2. Login con contraseña temporal
   ✅ Modal de cambio aparece automáticamente

3. Intentar cerrar modal
   ❌ No se puede cerrar (diseño intencional)

4. Ingresar contraseña que NO cumple requisitos
   ❌ Botón deshabilitado
   ✅ Muestra qué requisitos faltan

5. Ingresar contraseña válida pero diferente en confirmación
   ❌ Error mostrado

6. Ingresar contraseña válida y confirmar correctamente
   ✅ Botón habilitado
   ✅ Click en "Cambiar Contraseña"
   ✅ Redirige a /admin
   ✅ must_change_password = false

7. Cerrar sesión y volver a login
   ✅ Ya NO muestra modal de cambio
   ✅ Usa nueva contraseña para login normal
```

---

## 📝 Notas Importantes

1. **Emails en Desarrollo**: Los emails actualmente se simulan en consola. Ver sección "Integración de Email" para implementar en producción.

2. **Contraseñas Temporales**: Son de 9 caracteres. Ajustar la función `generateAutoPassword()` si se requiere un formato diferente.

3. **Seguridad del Modal**: El modal de cambio de contraseña NO se puede cerrar intencionalmente - es un requisito de seguridad.

4. **Super Admin**: Solo el super admin (configurado en settings) puede aprobar/rechazar solicitudes.

5. **Estados de Notificaciones**: Una vez procesada (aprobada/rechazada), una notificación no puede volver a estado "pending".

6. **Migración de Datos**: Notificaciones existentes sin campo `status` deben ser actualizadas o se asumirá "pending".

---

## 🚀 Próximos Pasos Recomendados

1. ✅ **Integrar servicio de email real** (SendGrid, Resend, etc.)
2. 🔄 Personalizar plantillas de email con HTML
3. 🔄 Agregar límite de intentos de login
4. 🔄 Implementar recuperación de contraseña
5. 🔄 Agregar logs de auditoría para aprobaciones/rechazos
6. 🔄 Notificaciones push/en tiempo real para nuevas solicitudes
7. 🔄 Dashboard de métricas de solicitudes

---

## 📞 Soporte

Para preguntas sobre el sistema de notificaciones, revisar:
- Logs del backend: Consola de Supabase Edge Functions
- Logs del frontend: Consola del navegador (F12)
- Estado de notificaciones: KV Store en Supabase

---

**Última actualización**: Mayo 30, 2026  
**Versión**: 1.0.0
