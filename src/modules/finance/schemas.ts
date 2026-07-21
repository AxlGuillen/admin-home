import { z } from "zod";

import { currencySchema, parseMoney } from "./money";

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

export const txnKindSchema = z.enum(["charge", "payment", "refund"]);
export type TxnKind = z.infer<typeof txnKindSchema>;

export const TXN_KIND_LABELS: Record<TxnKind, string> = {
  charge: "Cargo",
  payment: "Pago",
  refund: "Abono",
};

// Refines a charge; payments/refunds have no class. See migration 008.
export const txnClassSchema = z.enum([
  "regular",
  "commission",
  "msi_purchase",
  "msi_installment",
]);
export type TxnClass = z.infer<typeof txnClassSchema>;

export const TXN_CLASS_LABELS: Record<TxnClass, string> = {
  regular: "Regular",
  commission: "Comisión",
  msi_purchase: "Compra a meses",
  msi_installment: "Mensualidad",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(ISO_DATE, "Fecha inválida (YYYY-MM-DD)");

export const statementSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  cardId: z.uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  cutDate: z.string(),
  paymentDueDate: z.string(),
  daysInPeriod: z.number().int().nullable(),
  currency: z.string(),
  previousBalanceCents: z.number().int(),
  regularChargesCents: z.number().int(),
  installmentCapitalCents: z.number().int(),
  interestCents: z.number().int(),
  feesCents: z.number().int(),
  vatCents: z.number().int(),
  paymentsCreditsCents: z.number().int(),
  noInterestPaymentCents: z.number().int(),
  minimumPaymentCents: z.number().int(),
  minimumPlusInstallmentsCents: z.number().int(),
  totalDebtCents: z.number().int(),
  creditLimitCents: z.number().int().nullable(),
  availableCreditCents: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const statementTransactionSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  statementId: z.uuid(),
  operationDate: z.string().nullable(),
  chargeDate: z.string().nullable(),
  description: z.string(),
  amountCents: z.number().int(),
  kind: txnKindSchema,
  movementClass: txnClassSchema.nullable(),
  category: z.string().nullable(),
  originalAmountCents: z.number().int().nullable(),
  originalCurrency: z.string().nullable(),
  fxRate: z.number().nullable(),
  createdAt: z.string(),
});

// Extraction contract: I fill this JSON from each PDF, in pesos; cents live past this boundary.
const pesosToCents = (value: number) => Math.round(value * 100);
const pesos = z.number("Monto inválido").finite();
const pesosField = pesos.default(0).transform(pesosToCents);
const pesosNullable = pesos
  .nullable()
  .default(null)
  .transform((value) => (value === null ? null : pesosToCents(value)));

export const statementTransactionImportSchema = z
  .object({
    operationDate: isoDate.nullable().default(null),
    chargeDate: isoDate.nullable().default(null),
    description: z.string().trim().min(1, "Descripción obligatoria").max(200),
    amount: pesos
      .nonnegative("El monto no puede ser negativo")
      .transform(pesosToCents),
    kind: txnKindSchema,
    movementClass: txnClassSchema.nullable().default(null),
    category: z.preprocess(
      blankToNull,
      z.string().trim().max(40).nullable(),
    ).default(null),
    originalAmount: pesosNullable,
    originalCurrency: currencySchema.nullable().default(null),
    fxRate: z.number().positive().nullable().default(null),
  })
  .superRefine((txn, ctx) => {
    const isCharge = txn.kind === "charge";
    if (isCharge && txn.movementClass === null) {
      ctx.addIssue({
        code: "custom",
        path: ["movementClass"],
        message: "Un cargo necesita clase (regular, comisión, compra o mensualidad)",
      });
    }
    if (!isCharge && txn.movementClass !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["movementClass"],
        message: "Solo los cargos llevan clase",
      });
    }
  });

export const accountDirectionSchema = z.enum(["deposit", "withdrawal"]);
export type AccountDirection = z.infer<typeof accountDirectionSchema>;

export const ACCOUNT_DIRECTION_LABELS: Record<AccountDirection, string> = {
  deposit: "Depósito",
  withdrawal: "Retiro",
};

export const accountStatementSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  cardId: z.uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  cutDate: z.string(),
  daysInPeriod: z.number().int().nullable(),
  currency: z.string(),
  openingBalanceCents: z.number().int(),
  depositsCents: z.number().int(),
  depositsCount: z.number().int(),
  withdrawalsCents: z.number().int(),
  withdrawalsCount: z.number().int(),
  closingBalanceCents: z.number().int(),
  averageBalanceCents: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const accountMovementSchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  statementId: z.uuid(),
  operationDate: z.string().nullable(),
  liquidationDate: z.string().nullable(),
  description: z.string(),
  amountCents: z.number().int(),
  direction: accountDirectionSchema,
  balanceCents: z.number().int().nullable(),
  category: z.string().nullable(),
  createdAt: z.string(),
});

export const statementImportSchema = z.object({
  issuer: z.string().trim().min(1, "Banco obligatorio").max(60),
  product: z.string().trim().min(1, "Nombre de la tarjeta obligatorio").max(60),
  lastFour: z.string().regex(FOUR_DIGITS, "Deben ser exactamente 4 dígitos"),
  ownerName: z.string().trim().min(1, "Titular obligatorio").max(60),
  periodStart: isoDate,
  periodEnd: isoDate,
  cutDate: isoDate,
  paymentDueDate: isoDate,
  daysInPeriod: z.number().int().min(1).max(366).nullable().default(null),
  currency: currencySchema.default("MXN"),
  previousBalance: pesosField,
  regularCharges: pesosField,
  installmentCapital: pesosField,
  interest: pesosField,
  fees: pesosField,
  vat: pesosField,
  paymentsCredits: pesosField,
  noInterestPayment: pesosField,
  minimumPayment: pesosField,
  minimumPlusInstallments: pesosField,
  totalDebt: pesosField,
  creditLimit: pesosNullable,
  availableCredit: pesosNullable,
  transactions: z.array(statementTransactionImportSchema),
});
