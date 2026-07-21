import { z } from "zod";

import { parseMoney } from "./money";

// No card number, CVV, or expiry here on purpose: storing them would make this a target for real payment data.
export const cardTypeSchema = z.enum(["credito", "debito"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credito: "Crédito",
  debito: "Débito",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const FOUR_DIGITS = /^\d{4}$/;

/** An empty `<input>` arrives as "", an absent field as `undefined`; both become null. */
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
  // Owner label, not a permission: everyone in the household sees every card.
  ownerPersonId: z.preprocess(
    blankToNull,
    z.uuid("Persona inválida").nullable(),
  ),
  // User types pesos, stored as cents; the conversion lives here so no upper layer handles loose pesos.
  creditLimitCents: z.preprocess(
    (value) => {
      const blank = blankToNull(value);
      if (blank === null) return null;
      if (typeof blank !== "string") return blank;
      // NaN, not null, so validation fails with a message instead of silently saving "no limit".
      return parseMoney(blank) ?? Number.NaN;
    },
    z
      .number("Monto inválido")
      .int("Monto inválido")
      .positive("El límite debe ser mayor a cero")
      .nullable(),
  ),
};

// superRefine enforces the same invariant as the DB CHECK (credit needs a cycle); here it gives per-field errors.
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
  // Debit has no cycle or credit line: clear them rather than reject, since the form may carry stale values after a type switch.
  .transform((card) =>
    card.type === "debito"
      ? { ...card, cutDay: null, paymentDay: null, creditLimitCents: null }
      : card,
  );

export const updateCardInputSchema = z.object({
  id: z.uuid("Identificador inválido"),
});

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
  creditLimitCents: z.number().int().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
