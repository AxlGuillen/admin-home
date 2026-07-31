// Libro mayor del hogar: crédito y débito fundidos en una sola lista de
// movimientos. Las tablas son dos modelos distintos, pero para preguntar
// "¿cuánto gasté en farmacias?" la diferencia estorba.

import { monthOf } from "@/modules/finance/analytics-core";
import type { CardMovement } from "@/modules/finance/analytics-core";

import type { McpClient } from "./supabase";

export type CardKind = "credito" | "debito";

export type LedgerCard = {
  id: string;
  name: string;
  issuer: string | null;
  lastFour: string | null;
  type: CardKind;
  owner: string | null;
  cutDay: number | null;
  paymentDay: number | null;
  creditLimitCents: number | null;
  archived: boolean;
};

export type LedgerMovement = CardMovement & {
  cardId: string;
  cardName: string;
  cardType: CardKind;
  owner: string | null;
  /** `regular` | `commission` | `msi_purchase` | `msi_installment`; null en débito. */
  movementClass: string | null;
};

export type Ledger = {
  cards: LedgerCard[];
  people: string[];
  movements: LedgerMovement[];
  loadedAt: string;
};

const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

// PostgREST corta en 1000 filas por request y no avisa: sin paginar, los meses
// viejos simplemente no existirían para el LLM.
async function fetchAll<T>(
  label: string,
  page: (from: number, to: number) => Page<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`No se pudo leer ${label}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function loadLedger(client: McpClient): Promise<Ledger> {
  const [cardRows, peopleRows, creditStatements, accountStatements] =
    await Promise.all([
      fetchAll("las tarjetas", (from, to) =>
        client
          .from("home_finance_cards")
          .select(
            "id, name, issuer, last_four, type, owner_person_id, cut_day, payment_day, credit_limit_cents, archived_at",
          )
          .order("name")
          .range(from, to),
      ),
      fetchAll("las personas", (from, to) =>
        client.from("home_people").select("id, name").range(from, to),
      ),
      fetchAll("los estados de cuenta de crédito", (from, to) =>
        client
          .from("home_finance_statements")
          .select("id, card_id, cut_date")
          .range(from, to),
      ),
      fetchAll("los estados de cuenta de débito", (from, to) =>
        client
          .from("home_finance_account_statements")
          .select("id, card_id, cut_date")
          .range(from, to),
      ),
    ]);

  const [creditTxns, accountMovements] = await Promise.all([
    fetchAll("los movimientos de crédito", (from, to) =>
      client
        .from("home_finance_statement_transactions")
        .select(
          "statement_id, charge_date, operation_date, description, amount_cents, category, kind, movement_class",
        )
        .range(from, to),
    ),
    fetchAll("los movimientos de débito", (from, to) =>
      client
        .from("home_finance_account_movements")
        .select(
          "statement_id, operation_date, description, amount_cents, category, direction",
        )
        .range(from, to),
    ),
  ]);

  const personName = new Map(peopleRows.map((p) => [p.id, p.name]));
  const cards: LedgerCard[] = cardRows.map((c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    lastFour: c.last_four,
    type: c.type,
    owner: c.owner_person_id ? (personName.get(c.owner_person_id) ?? null) : null,
    cutDay: c.cut_day,
    paymentDay: c.payment_day,
    creditLimitCents: c.credit_limit_cents,
    archived: c.archived_at !== null,
  }));

  const cardById = new Map(cards.map((c) => [c.id, c]));
  const statementCard = new Map<string, string>();
  const statementMonth = new Map<string, string>();
  for (const s of [...creditStatements, ...accountStatements]) {
    statementCard.set(s.id, s.card_id);
    statementMonth.set(s.id, monthOf(s.cut_date));
  }

  const movements: LedgerMovement[] = [];

  const push = (
    statementId: string,
    date: string | null,
    movement: Omit<CardMovement, "month" | "date"> & { movementClass: string | null },
  ) => {
    const card = cardById.get(statementCard.get(statementId) ?? "");
    if (!card) return;
    movements.push({
      ...movement,
      date,
      month: date ? monthOf(date) : (statementMonth.get(statementId) ?? ""),
      cardId: card.id,
      cardName: card.name,
      cardType: card.type,
      owner: card.owner,
    });
  };

  for (const t of creditTxns) {
    push(t.statement_id, t.charge_date ?? t.operation_date, {
      description: t.description,
      amountCents: t.amount_cents,
      category: t.category,
      flow: t.kind === "charge" ? "out" : "in",
      movementClass: t.movement_class,
    });
  }

  for (const m of accountMovements) {
    push(m.statement_id, m.operation_date, {
      description: m.description,
      amountCents: m.amount_cents,
      category: m.category,
      flow: m.direction === "deposit" ? "in" : "out",
      movementClass: null,
    });
  }

  movements.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return { cards, people: [...personName.values()], movements, loadedAt: new Date().toISOString() };
}

// Una pregunta del LLM suele encadenar varias herramientas seguidas; recargar
// ~2,000 filas en cada una haría la conversación lentísima sin ganar frescura.
const TTL_MS = 60_000;
const MAX_ENTRIES = 4;

// Indexada por hogar, nunca global: una instancia de Node se reutiliza entre
// requests de usuarios distintos, y RLS protege el fetch, no la memoria. Sin la
// clave, el segundo usuario en caer en la instancia recibe el ledger del primero.
const cache = new Map<string, { at: number; ledger: Promise<Ledger> }>();

/**
 * Separada de `getLedger` para poder probar el aislamiento sin una BD detrás:
 * la clave es la propiedad de seguridad, así que tiene que tener test.
 *
 * `householdKey` es el conjunto ordenado de hogares del usuario, no uno solo:
 * `home_private.user_household_ids()` devuelve un `setof`, así que RLS entrega la
 * unión, y cachear esa unión bajo un id suelto se la serviría a quien solo
 * pertenece a ese.
 */
export function cachedByHousehold(
  householdKey: string,
  load: () => Promise<Ledger>,
): Promise<Ledger> {
  const hit = cache.get(householdKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ledger;

  // Se guarda la promesa, no el valor: el LLM dispara herramientas en paralelo y
  // así varias llamadas concurrentes colapsan en una sola carga.
  const loading = load();
  cache.set(householdKey, { at: Date.now(), ledger: loading });
  loading.catch(() => {
    if (cache.get(householdKey)?.ledger === loading) cache.delete(householdKey);
  });

  for (const key of cache.keys()) {
    if (cache.size <= MAX_ENTRIES) break;
    cache.delete(key);
  }
  return loading;
}

/** Solo para los tests: la caché vive en el módulo y se filtraría entre casos. */
export function resetLedgerCache(): void {
  cache.clear();
}

export function getLedger(
  client: McpClient,
  householdKey: string,
): Promise<Ledger> {
  return cachedByHousehold(householdKey, () => loadLedger(client));
}
