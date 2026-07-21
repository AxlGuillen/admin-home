/**
 * Zona horaria del hogar.
 *
 * Todo cálculo de "hoy" pasa por aquí. El servidor de producción corre en UTC, así
 * que usar la hora del proceso daría fechas equivocadas a partir de las 6pm hora de
 * México. Fijarla hace el resultado igual en tu laptop y en producción.
 *
 * Cuando haya más de un hogar con zonas distintas, esto se vuelve una columna de
 * `home_households` y esta constante pasa a ser solo el default.
 */
export const HOUSEHOLD_TIME_ZONE = "America/Mexico_City";

/** Locale para formatear fechas y montos en la UI. */
export const HOUSEHOLD_LOCALE = "es-MX";
