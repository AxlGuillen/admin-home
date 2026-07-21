# Módulo: finance

## Dominio

Tarjetas bancarias del hogar (débito y crédito) y, más adelante, el historial de pagos
mes a mes de cada una.

Fuera de alcance: presupuestos, inversiones, conexión automática con bancos.

## Estado

CRUD de tarjetas completo. Estados de cuenta: capa de datos lista (tablas, schemas,
tipos, lecturas). El registro se hace de forma semi-manual —los PDFs se extraen al
formato de `statementImportSchema` y se cargan por SQL— tarjeta por tarjeta. La UI de
estados de cuenta (calendario de pagos, utilización, gasto) todavía no existe.

## Contrato público

Lo que exporta `index.ts`. Nada más del módulo puede importarse desde fuera.

Dos entry points: `index.ts` (cliente + servidor) y `server.ts` (solo servidor).

| Export | Dónde | Para qué |
| ------ | ----- | -------- |
| `listCards`, `getCard`, `toCard` | `server.ts` | Lecturas. Importan `server-only`. |
| `createCard`, `updateCard` | actions | Alta y edición desde formulario. |
| `archiveCard`, `restoreCard`, `deleteCard` | actions | Archivar / restaurar / borrar. |
| `CardFormDialog`, `CardItem` | componentes | UI de tarjetas. |
| `cardInputSchema`, `cardSchema`, `cardTypeSchema` | schemas | Validación. |
| `Card`, `CardType`, `CreditCard`, `isCreditCard` | tipos | Modelo de dominio. |
| `nextPaymentDate`, `lastCutDate`, `formatCivilDate`, … | ciclo | Fechas de corte y pago. |
| `formatMoney`, `parseMoney`, `Money` | dinero | Montos en centavos. |
| `listStatements`, `latestStatementsByCard`, `getStatementWithTransactions` | `server.ts` | Lecturas de estados de cuenta. |
| `toStatement`, `toStatementTransaction` | `server.ts` | Traducción de fila a dominio. |
| `statementImportSchema`, `statementTransactionImportSchema` | schemas | Contrato de extracción del PDF (en pesos). |
| `statementSchema`, `statementTransactionSchema`, `txnKindSchema`, `TXN_KIND_LABELS` | schemas | Modelo de dominio. |
| `Statement`, `StatementTransaction`, `StatementWithTransactions`, `StatementImport`, `TxnKind` | tipos | Modelo de dominio. |

## Tablas

| Tabla | Descripción | RLS |
| ----- | ----------- | --- |
| `home_finance_cards` | Tarjetas del hogar, débito y crédito juntas. | miembros del `household_id` |
| `home_finance_statements` | Cabecera del estado de cuenta, 1 por `(card_id, cut_date)`. | miembros del `household_id` |
| `home_finance_statement_transactions` | Movimientos de un estado de cuenta. | miembros del `household_id` |

El hogar vive en `home_households` / `home_household_members` (migración 003), fuera de
este módulo porque lo van a compartir todos.

## Invariantes

1. **Nunca se guarda el número de tarjeta, CVV ni fecha de caducidad.** No habilitan
   ninguna función de esta app y convierten la base en un objetivo con datos de pago
   reales. Solo `issuer` + `last_four`, que sirven para identificar y no para cobrar.
   Si alguien pide agregarlos, discútelo antes de implementarlo.
2. **`cut_day` y `payment_day` son días del mes (1-31), no fechas.** El ciclo se repite.
   Guardarlos como `date` obligaría a un registro por mes o a una fecha que miente.
3. **Crédito exige ciclo, débito no lo tiene.** Lo hace cumplir el CHECK
   `home_finance_cards_cycle` en la BD y el `superRefine` de `cardInputSchema`.
   Si cambias uno, cambia el otro.
4. **Archivar es el "borrar" del CRUD.** `archived_at` en vez de `DELETE`, para que el
   historial de estados de cuenta sobreviva. **Ya hay tablas que apuntan a la tarjeta**:
   `home_finance_statements` tiene FK `ON DELETE CASCADE`, así que `deleteCard` ahora
   **borra en silencio todos los estados de cuenta y movimientos de esa tarjeta**. Hay que
   bloquear `deleteCard` cuando la tarjeta tenga estados de cuenta (o cambiar el borrado
   por un archivar forzado). Pendiente antes de exponer `deleteCard` con datos reales.
5. **Los montos van en centavos (`integer`), nunca `float`.** Ver `money.ts`.
7. **`owner_person_id` es una etiqueta, no un permiso.** Dice de quién es la tarjeta y
   permite filtrar; **no** restringe quién la ve. Todos los miembros del hogar ven todas
   las tarjetas. Es distinto de `created_by`, que es quién la registró y no cambia.
   - La FK es **compuesta** `(household_id, owner_person_id)`: obliga a que el dueño sea
     del mismo hogar. Con una FK simple se podía apuntar a una persona de otro hogar
     (verificado contra la BD antes de arreglarlo).
   - `on delete set null (owner_person_id)` — con la lista de columnas, porque sin ella
     Postgres intentaría anular también `household_id`, que es NOT NULL, y borrar a una
     persona reventaría. Borrar a alguien deja sus tarjetas sin dueño, nunca las borra.
8. **`credit_limit_cents` solo aplica a crédito**, en centavos, y siempre > 0. Dos CHECK
   lo hacen cumplir. El formulario acepta pesos ("$50,000.00") y `cardInputSchema`
   convierte a centavos; si el texto es ilegible **falla** en vez de guardar null, para
   que la tarjeta no quede sin límite en silencio.
6. Toda action llama `requireHousehold()` antes de tocar la BD. Las Server Actions son
   endpoints HTTP: se pueden invocar sin pasar por el layout.

## Reglas del ciclo de facturación

Viven en `billing-cycle.ts`, con tests. Las tres que se olvidan siempre:

- **Zona horaria explícita.** No existe un `today()` sin zona, a propósito. El servidor
  de producción corre en UTC: usar la hora del proceso hacía que a partir de las 6pm
  hora de México la app dijera un día menos, y que el mismo día del pago lo diera por
  vencido. Usa `todayIn(HOUSEHOLD_TIME_ZONE)` de `@/shared/config/household`.

- **Meses cortos**: corte el 31 en febrero es el 28 (o 29). Se ajusta, no se desborda.
- **En qué mes cae el pago**: si `paymentDay > cutDay`, mismo mes que el corte
  (corte 5 → pago 25 de marzo). Si es menor o igual, el mes siguiente
  (corte 25 marzo → pago 14 de abril). La comparación usa los días **configurados**,
  no los ya ajustados por mes corto.

Se trabaja con `CivilDate` (`{year, month, day}`) en vez de `Date` a propósito: "el corte
es el día 5" no tiene hora ni zona horaria, y meter `Date` ahí introduce bugs de offset.

## Decisiones tomadas

- **Débito y crédito en la misma tabla**, distinguidos por `type`. El usuario los ve como
  "mis tarjetas"; separarlos duplicaría CRUD y pantallas sin ganar nada.
- **Día fijo de pago** (`payment_day`) en vez de "N días después del corte". Elegido por
  el usuario; obliga a la regla de "en qué mes cae" descrita arriba.
- **Límite de crédito sí, moneda por tarjeta todavía no.** El límite entró porque
  habilita el % de utilización en los estados de cuenta y era más barato ahora que
  migrar después. La moneda sigue pendiente: `money.ts` ya la exige explícita.
- **Las tarjetas son del hogar, no del usuario.** `household_id`, no `user_id`.

## Estados de cuenta

- **Un registro por estado de cuenta** (`home_finance_statements`): corte, fechas del
  periodo, límite, saldo total, pago mínimo, pago para no generar intereses, resumen de
  cargos/abonos. Sus movimientos van en `home_finance_statement_transactions`.
- **Formato regulado.** CONDUSEF obliga a la misma estructura en todos los bancos, así que
  una sola forma normalizada sirve para INVEX, BBVA, Banamex, Nu, etc.
- **Nunca se guarda el PDF ni PAN/RFC/CLABE.** La extracción los descarta; solo queda
  `last_four` en la tarjeta. Misma postura que la invariante 1 de tarjetas.
- **El statement vive en el mismo hogar que su tarjeta**, por FK compuesta
  `(card_id, household_id)`. Imposible cruzar hogares en la BD.
- **`amount_cents` es magnitud; el signo lo da `kind`** (`charge`/`payment`/`refund`).
- **Moneda por movimiento.** El monto va en MXN; si el cargo fue en otra divisa se guardan
  `original_amount_cents` + `original_currency` + `fx_rate` (los tres o ninguno, por CHECK).
- **Ingreso semi-manual.** No hay upload ni API: los PDFs se extraen al formato de
  `statementImportSchema` (en pesos) y se cargan por SQL. `UNIQUE(card_id, cut_date)` evita
  duplicar un mes al recargar.
- **Interés e IVA no se guardan como movimiento**, solo sus totales en el header
  (`interest_cents`, `vat_cents`). Algunos bancos (Banamex) los itemizan como líneas y otros
  (BBVA) no; guardarlos solo de unos rompía la consistencia entre bancos. Si algún día se
  necesitan al detalle, se agregan clases `interest`/`tax` a `movement_class`.
- **Validación de carga:** los cargos con `movement_class='regular'` deben sumar exactamente
  `regular_charges_cents` del header (el "Cargos regulares (no a meses)" del PDF). Es el
  check que se corre por banco antes de dar por buena una extracción.

## Decisiones pendientes

Preguntar antes de implementar; no elegir por el usuario:

1. **Invitaciones al hogar.** Hoy agregar miembros se hace desde el dashboard: no hay
   políticas de insert en `home_household_members` a propósito.
2. **Tarjetas con "60 días de pago".** El modelo `cut_day`/`payment_day` asume pago ~1 mes
   después del corte; algunas tarjetas (Plata) pagan a 60 días. Falta decidir cómo
   representarlo sin romper el calendario.
3. **Bloquear `deleteCard`** cuando la tarjeta tenga estados de cuenta (ver invariante 4).
