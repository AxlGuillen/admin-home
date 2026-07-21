/**
 * Paleta compartida para identificar cosas de un vistazo (tarjetas, personas).
 * Vive en `lib` porque la usan varios módulos y no depende de nada.
 */
export const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;

/** Color estable a partir de un id, para lo que no tiene color asignado. */
export function colorFromId(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
