export const PRIMARY_ADMIN_EMAIL = 'samanta.camacho@upax.com.mx';

export const ADMIN_CSV_HEADERS = [
  'id',
  'nombre',
  'email',
  'rol',
  'acceso_notificaciones',
  'acceso_configuracion',
  'debe_cambiar_password',
] as const;

export interface AdminCsvRow {
  id?: string;
  nombre: string;
  email: string;
  rol: string;
  acceso_notificaciones: boolean;
  acceso_configuracion: boolean;
  debe_cambiar_password?: boolean;
}

const VALID_ROLES = new Set(['Administrador', 'Editor', 'Visualizador']);

function escapeCell(value: string): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function parseBool(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase();
  return ['true', '1', 'yes', 'si', 'sí'].includes(normalized);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function adminsToCsv(admins: Array<Record<string, unknown>>): string {
  const headerRow = ADMIN_CSV_HEADERS.join(',');
  const dataRows = admins.map((admin) => {
    const cells = [
      String(admin.id ?? ''),
      String(admin.name ?? admin.nombre ?? ''),
      String(admin.email ?? ''),
      String(admin.role ?? admin.rol ?? 'Administrador'),
      admin.can_access_notifications === true ? 'true' : 'false',
      admin.can_access_settings === true ? 'true' : 'false',
      admin.must_change_password === true ? 'true' : 'false',
    ];
    return cells.map(escapeCell).join(',');
  });

  return `\uFEFF${[headerRow, ...dataRows].join('\n')}`;
}

export function parseAdminCsv(text: string): { rows: AdminCsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: AdminCsvRow[] = [];

  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) {
    return { rows, errors: ['El archivo CSV está vacío.'] };
  }

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows, errors: ['El CSV debe incluir encabezados y al menos una fila de datos.'] };
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const indexOf = (name: string) => headerCells.indexOf(name);

  const nombreIdx = indexOf('nombre');
  const emailIdx = indexOf('email');
  const idIdx = indexOf('id');
  const rolIdx = indexOf('rol');
  const notifIdx = indexOf('acceso_notificaciones');
  const settingsIdx = indexOf('acceso_configuracion');
  const mustChangeIdx = indexOf('debe_cambiar_password');

  if (nombreIdx === -1 || emailIdx === -1) {
    return {
      rows,
      errors: ['El CSV debe incluir las columnas "nombre" y "email".'],
    };
  }

  for (let lineNumber = 1; lineNumber < lines.length; lineNumber += 1) {
    const cells = parseCsvLine(lines[lineNumber]);
    const nombre = cells[nombreIdx]?.trim() ?? '';
    const email = cells[emailIdx]?.trim().toLowerCase() ?? '';
    const rol = (rolIdx >= 0 ? cells[rolIdx]?.trim() : '') || 'Administrador';

    if (!nombre || !email) {
      errors.push(`Fila ${lineNumber + 1}: nombre y email son obligatorios.`);
      continue;
    }

    if (!email.includes('@')) {
      errors.push(`Fila ${lineNumber + 1}: email inválido (${email}).`);
      continue;
    }

    if (!VALID_ROLES.has(rol)) {
      errors.push(`Fila ${lineNumber + 1}: rol inválido (${rol}).`);
      continue;
    }

    rows.push({
      id: idIdx >= 0 ? cells[idIdx]?.trim() || undefined : undefined,
      nombre,
      email,
      rol,
      acceso_notificaciones: notifIdx >= 0 ? parseBool(cells[notifIdx]) : false,
      acceso_configuracion: settingsIdx >= 0 ? parseBool(cells[settingsIdx]) : false,
      debe_cambiar_password: mustChangeIdx >= 0 ? parseBool(cells[mustChangeIdx]) : undefined,
    });
  }

  return { rows, errors };
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
