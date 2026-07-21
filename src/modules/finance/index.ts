/**
 * Contrato público del módulo de finanzas.
 *
 * Todavía no hay tarjetas ni pagos — ver las decisiones pendientes en CLAUDE.md.
 */
export {
  currencySchema,
  formatMoney,
  money,
  moneySchema,
  parseMoney,
} from "./money";
export type { Currency, Money } from "./money";
