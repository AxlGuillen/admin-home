/**
 * Contrato público del módulo de finanzas. Seguro de importar desde cliente y
 * servidor. Las lecturas viven en `@/modules/finance/server` (ver ese archivo).
 *
 * Lo que no aparezca en uno de los dos entry points es privado: ESLint bloquea
 * importarlo desde fuera.
 */
export {
  archiveCard,
  createCard,
  deleteCard,
  restoreCard,
  updateCard,
} from "./actions";
export {
  CARD_TYPE_LABELS,
  cardInputSchema,
  cardSchema,
  cardTypeSchema,
} from "./schemas";
export type { CardType } from "./schemas";
export { isCreditCard } from "./types";
export type { Card, CardInput, CreditCard } from "./types";

export { CardFormDialog } from "./components/card-form-dialog";
export { CardItem } from "./components/card-item";
export { CardListSkeleton } from "./components/card-list-skeleton";

export {
  currencySchema,
  formatMoney,
  money,
  moneySchema,
  parseMoney,
} from "./money";
export type { Currency, Money } from "./money";

export {
  daysUntil,
  formatCivilDate,
  lastCutDate,
  nextCutDate,
  nextPaymentDate,
  paymentDateForCut,
  todayIn,
} from "./billing-cycle";
export type { CivilDate } from "./billing-cycle";
