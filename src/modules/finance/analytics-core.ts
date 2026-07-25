// Tercer entry point del módulo: el análisis sin runtime. Ni `server-only` ni
// `requireHousehold()`, así que lo puede importar un proceso Node plano — hoy el
// servidor MCP. Quien tenga el request de Next debe usar `server.ts`.

export {
  computeCardDetail,
  computeDuplicates,
  computeFinanceOverview,
  computeRecurring,
  merchantKey,
  monthOf,
  NON_SPEND,
  subscriptionName,
} from "./analytics-compute";
export { fetchCardDetailRows, fetchOverviewRows } from "./analytics-fetch";
export type * from "./analytics-types";
