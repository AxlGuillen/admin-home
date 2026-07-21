import { z } from "zod";

/**
 * Fuente de verdad del dominio de tarjetas.
 *
 * Nota deliberada: aquí no hay número de tarjeta, CVV ni fecha de caducidad. No
 * habilitan nada en esta app y guardarlos convertiría una base doméstica en un
 * objetivo con datos de pago reales. Ver CLAUDE.md del módulo.
 */
export const cardTypeSchema = z.enum(["credito", "debito"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credito: "Crédito",
  debito: "Débito",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const FOUR_DIGITS = /^\d{4}$/;

/** Un `<input>` vacío llega como "", y un campo ausente como `undefined`. Ambos son null. */
const blankToNull = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "")
    ? null
    : value;

const dayOfMonth = z
  .coerce.number<number>()
  .int("Debe ser un número entero")
  .min(1, "El día va del 1 al 31")
  .max(31, "El día va del 1 al 31");

const baseCardFields = {
  type: cardTypeSchema,
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(60, "Máximo 60 caracteres"),
  description: z.preprocess(
    blankToNull,
    z.string().trim().max(500, "Máximo 500 caracteres").nullable(),
  ),
  issuer: z.preprocess(
    blankToNull,
    z.string().trim().max(60, "Máximo 60 caracteres").nullable(),
  ),
  lastFour: z.preprocess(
    blankToNull,
    z.string().regex(FOUR_DIGITS, "Deben ser exactamente 4 dígitos").nullable(),
  ),
  color: z.preprocess(
    blankToNull,
    z.string().regex(HEX_COLOR, "Color inválido").nullable(),
  ),
  cutDay: z.preprocess(blankToNull, dayOfMonth.nullable()),
  paymentDay: z.preprocess(blankToNull, dayOfMonth.nullable()),
  // Etiqueta de a quién pertenece. No restringe quién la ve: en el hogar todos
  // ven todas las tarjetas.
  ownerPersonId: z.preprocess(
    blankToNull,
    z.uuid("Persona inválida").nullable(),
  ),
};

/**
 * Lo que manda el formulario. El `superRefine` es lo que hace cumplir la misma
 * invariante que el CHECK de la BD: crédito necesita ciclo, débito no lo tiene.
 * Validar aquí da errores por campo; el CHECK es la red por si algo se salta esto.
 */
export const cardInputSchema = z
  .object(baseCardFields)
  .superRefine((card, ctx) => {
    if (card.type !== "credito") return;

    if (card.cutDay === null) {
      ctx.addIssue({
        code: "custom",
        path: ["cutDay"],
        message: "Una tarjeta de crédito necesita día de corte",
      });
    }
    if (card.paymentDay === null) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentDay"],
        message: "Una tarjeta de crédito necesita día de pago",
      });
    }
  })
  // Débito no tiene ciclo: se limpia en vez de rechazar, porque el formulario
  // puede traer valores viejos si el usuario cambió el tipo después de escribirlos.
  .transform((card) =>
    card.type === "debito"
      ? { ...card, cutDay: null, paymentDay: null }
      : card,
  );

export const updateCardInputSchema = z.object({
  id: z.uuid("Identificador inválido"),
});

/** Una tarjeta ya persistida, como la ve el resto de la app. */
export const cardSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  type: cardTypeSchema,
  name: z.string(),
  description: z.string().nullable(),
  issuer: z.string().nullable(),
  lastFour: z.string().nullable(),
  color: z.string().nullable(),
  cutDay: z.number().int().nullable(),
  paymentDay: z.number().int().nullable(),
  ownerPersonId: z.uuid().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
