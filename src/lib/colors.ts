/**
 * Colores de persona. Referencian los tokens del SKIN en vez de traer hexes
 * propios: la paleta anterior era el arcoíris por defecto de Tailwind, donde
 * un color era prácticamente la marca, otro prácticamente el rojo de estado, y
 * ninguno de los ocho aguantaba la inicial en blanco que va encima (1.9–4.2:1).
 *
 * Son tres a propósito: el círculo de hue ya está ocupado por marca, estado y
 * matices de dato, y estos son los tres huecos donde cabe una persona sin
 * confundirse con nada. Con más de tres miembros, dos comparten color; se
 * resuelve poniéndoselo a mano en `home_people.color`.
 */
export const PALETTE = ["var(--p-1)", "var(--p-2)", "var(--p-3)"] as const;

export function colorFromId(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
