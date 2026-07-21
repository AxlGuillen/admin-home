/**
 * Entry point **de servidor** del módulo.
 *
 * Las queries importan `server-only`; exponerlas en `index.ts` haría que cualquier
 * Client Component que importe el módulo arrastre código de servidor al bundle.
 *
 * Regla: Server Components y Server Actions usan `@/modules/finance/server`;
 * todo lo demás usa `@/modules/finance`.
 */
export { getCard, listCards, toCard } from "./queries";
