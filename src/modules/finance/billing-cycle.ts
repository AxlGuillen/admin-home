/**
 * Fechas del ciclo de una tarjeta de crédito.
 *
 * `cutDay` y `paymentDay` son días del mes (1-31), no fechas: el ciclo se repite.
 * De ahí salen dos reglas que hay que aplicar en todos lados:
 *
 * 1. **Meses cortos.** Corte el 31 en febrero es el 28 (o 29). Se ajusta al último
 *    día del mes, nunca se desborda al 1 de marzo.
 * 2. **En qué mes cae el pago.** Si `paymentDay > cutDay`, el pago es del mismo mes
 *    que el corte (corte 5, pago 25 → ambos en marzo). Si es menor o igual, cae en
 *    el mes siguiente (corte 25, pago 14 → corte 25 marzo, pago 14 abril).
 *
 * Todo se calcula sobre fechas civiles (año/mes/día) en vez de `Date`, porque
 * `Date` arrastra zona horaria y "el corte es el día 5" no tiene hora ni offset.
 */

/** Fecha civil. `month` va de 1 a 12, no de 0 a 11 como en `Date`. */
export type CivilDate = { year: number; month: number; day: number };

export function daysInMonth(year: number, month: number): number {
  // El día 0 del mes siguiente es el último del mes actual.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Ajusta un día del mes al último día disponible: 31 en febrero → 28. */
export function clampDay(year: number, month: number, day: number): CivilDate {
  return { year, month, day: Math.min(day, daysInMonth(year, month)) };
}

function addMonths(year: number, month: number, delta: number) {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  return (
    a.year - b.year || a.month - b.month || a.day - b.day
  );
}

export function toISODate({ year, month, day }: CivilDate): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Fecha civil de "hoy" en una zona horaria explícita.
 *
 * La zona es obligatoria a propósito. `new Date().getDate()` usa la zona del proceso:
 * en tu máquina es la de México y todo se ve bien, pero en producción el servidor
 * corre en UTC — seis horas adelante. Eso hacía que a partir de las 6pm hora local la
 * app dijera un día menos de los que faltan, y que el mismo día del pago lo diera por
 * vencido. Un `today()` sin zona invita justo a ese bug, así que no existe.
 */
export function todayIn(timeZone: string, now: Date = new Date()): CivilDate {
  // "en-CA" formatea como YYYY-MM-DD, pero se leen las partes en vez de parsear
  // el string para no depender del formato del locale.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Último corte ocurrido, contando hoy como ya ocurrido. */
export function lastCutDate(cutDay: number, ref: CivilDate): CivilDate {
  const thisMonth = clampDay(ref.year, ref.month, cutDay);
  if (compareCivil(thisMonth, ref) <= 0) return thisMonth;

  const prev = addMonths(ref.year, ref.month, -1);
  return clampDay(prev.year, prev.month, cutDay);
}

/** Siguiente corte por venir. Si hoy es día de corte, el siguiente es el del mes que entra. */
export function nextCutDate(cutDay: number, ref: CivilDate): CivilDate {
  const thisMonth = clampDay(ref.year, ref.month, cutDay);
  if (compareCivil(thisMonth, ref) > 0) return thisMonth;

  const next = addMonths(ref.year, ref.month, 1);
  return clampDay(next.year, next.month, cutDay);
}

/** Fecha límite de pago que corresponde a un corte dado. */
export function paymentDateForCut(
  cutDay: number,
  paymentDay: number,
  cut: CivilDate,
): CivilDate {
  // Se comparan los días CONFIGURADOS, no los ya ajustados: con corte 31 y pago 20
  // en febrero, el corte real es el 28, pero el pago sigue siendo del mes siguiente.
  const monthsAhead = paymentDay > cutDay ? 0 : 1;
  const { year, month } = addMonths(cut.year, cut.month, monthsAhead);
  return clampDay(year, month, paymentDay);
}

/** Próxima fecha límite de pago a partir de `ref` (hoy cuenta como pendiente). */
export function nextPaymentDate(
  cutDay: number,
  paymentDay: number,
  ref: CivilDate,
): CivilDate {
  const fromLastCut = paymentDateForCut(
    cutDay,
    paymentDay,
    lastCutDate(cutDay, ref),
  );
  if (compareCivil(fromLastCut, ref) >= 0) return fromLastCut;

  return paymentDateForCut(cutDay, paymentDay, nextCutDate(cutDay, ref));
}

/** Días que faltan para una fecha civil. Negativo si ya pasó. */
export function daysUntil(target: CivilDate, ref: CivilDate): number {
  const MS_PER_DAY = 86_400_000;
  const a = Date.UTC(target.year, target.month - 1, target.day);
  const b = Date.UTC(ref.year, ref.month - 1, ref.day);
  return Math.round((a - b) / MS_PER_DAY);
}

/** "15 de abril de 2026" */
export function formatCivilDate(date: CivilDate, locale = "es-MX"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
