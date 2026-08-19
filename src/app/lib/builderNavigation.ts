const RETURN_PROYECTO_KEY = 'builder_return_proyecto_id';

export function setBuilderReturnProyecto(proyectoId: string): void {
  sessionStorage.setItem(RETURN_PROYECTO_KEY, proyectoId);
}

export function getBuilderReturnProyecto(): string | null {
  return sessionStorage.getItem(RETURN_PROYECTO_KEY);
}

export function clearBuilderReturnProyecto(): void {
  sessionStorage.removeItem(RETURN_PROYECTO_KEY);
}

export function navigateToAdminProyecto(
  navigate: (path: string, options?: { state?: { openProyectoId: string } }) => void,
  proyectoId: string | null | undefined,
): void {
  if (proyectoId) {
    navigate('/admin', { state: { openProyectoId: proyectoId } });
    return;
  }
  navigate('/admin');
}
