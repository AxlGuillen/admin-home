// Qué tours ya vio ESTE dispositivo. localStorage a propósito: sincronizarlo
// entre dispositivos costaría migración + RLS para 4 personas (docs/tour-plan.md).
// Subir la versión de un tour lo re-muestra cuando la pantalla cambie fuerte.

const tourKey = (screen: string, version: number) =>
  `ah-tour:${screen}:v${version}`;

export function hasSeenTour(screen: string, version = 1): boolean {
  try {
    return localStorage.getItem(tourKey(screen, version)) === "1";
  } catch {
    // Sin storage (Safari privado, storage lleno) es mejor callar el tour que
    // repetirlo en cada visita.
    return true;
  }
}

export function markTourSeen(screen: string, version = 1): void {
  try {
    localStorage.setItem(tourKey(screen, version), "1");
  } catch {
    // Sin storage no hay nada que persistir.
  }
}
