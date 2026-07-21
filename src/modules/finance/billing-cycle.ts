/** Civil date. `month` is 1-12, not 0-11 like `Date`. */
export type CivilDate = { year: number; month: number; day: number };

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of the current one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

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

// Time zone is required: production runs in UTC, so process-local time is a day off after 6pm Mexico time.
export function todayIn(timeZone: string, now: Date = new Date()): CivilDate {
  // Read the parts instead of parsing the formatted string, to not depend on the locale's format.
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

export function lastCutDate(cutDay: number, ref: CivilDate): CivilDate {
  const thisMonth = clampDay(ref.year, ref.month, cutDay);
  if (compareCivil(thisMonth, ref) <= 0) return thisMonth;

  const prev = addMonths(ref.year, ref.month, -1);
  return clampDay(prev.year, prev.month, cutDay);
}

export function nextCutDate(cutDay: number, ref: CivilDate): CivilDate {
  const thisMonth = clampDay(ref.year, ref.month, cutDay);
  if (compareCivil(thisMonth, ref) > 0) return thisMonth;

  const next = addMonths(ref.year, ref.month, 1);
  return clampDay(next.year, next.month, cutDay);
}

export function paymentDateForCut(
  cutDay: number,
  paymentDay: number,
  cut: CivilDate,
): CivilDate {
  // Compare the configured days, not the clamped ones: a cut clamped to Feb 28 must not pull the payment into the same month.
  const monthsAhead = paymentDay > cutDay ? 0 : 1;
  const { year, month } = addMonths(cut.year, cut.month, monthsAhead);
  return clampDay(year, month, paymentDay);
}

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

export function daysUntil(target: CivilDate, ref: CivilDate): number {
  const MS_PER_DAY = 86_400_000;
  const a = Date.UTC(target.year, target.month - 1, target.day);
  const b = Date.UTC(ref.year, ref.month - 1, ref.day);
  return Math.round((a - b) / MS_PER_DAY);
}

export function formatCivilDate(date: CivilDate, locale = "es-MX"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
