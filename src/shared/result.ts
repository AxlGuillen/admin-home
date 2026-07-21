/**
 * Resultado de una Server Action. Devolver errores en vez de lanzarlos hace que
 * el formulario del cliente pueda pintarlos sin reventar el árbol de React.
 *
 * `fieldErrors` sale directo de `z.flattenError(err).fieldErrors`.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail<T = never>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}
