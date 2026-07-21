# Módulo: finance

## Dominio

Tarjetas bancarias del hogar (débito y crédito) y, más adelante, el historial de pagos
mes a mes de cada una.

Fuera de alcance: presupuestos, inversiones, conexión automática con bancos.

## Estado

CRUD de tarjetas completo. Los pagos todavía no existen.

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

## Tablas

| Tabla | Descripción | RLS |
| ----- | ----------- | --- |
| `home_finance_cards` | Tarjetas del hogar, débito y crédito juntas. | miembros del `household_id` |

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
   historial de pagos sobreviva. `deleteCard` existe pero **hay que bloquearlo en cuanto
   existan pagos**: hoy es seguro solo porque nada apunta a una tarjeta todavía.
5. **Los montos van en centavos (`integer`), nunca `float`.** Ver `money.ts`.
7. **`owner_person_id` es una etiqueta, no un permiso.** Dice de quién es la tarjeta y
   permite filtrar; **no** restringe quién la ve. Todos los miembros del hogar ven todas
   las tarjetas. Es distinto de `created_by`, que es quién la registró y no cambia.
   La FK es `on delete set null`: borrar a una persona deja sus tarjetas sin dueño,
   nunca las borra.
6. Toda action llama `requireHousehold()` antes de tocar la BD. Las Server Actions son
   endpoints HTTP: se pueden invocar sin pasar por el layout.

## Reglas del ciclo de facturación

Viven en `billing-cycle.ts`, con tests. Las dos que se olvidan siempre:

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
- **Sin límite de crédito ni moneda por tarjeta** por ahora. Cuando entren los pagos hay
  que decidir la moneda: `money.ts` ya la exige explícita en cada monto.
- **Las tarjetas son del hogar, no del usuario.** `household_id`, no `user_id`.

## Decisiones pendientes

Preguntar antes de implementar; no elegir por el usuario:

1. **Corte vs. pago en el historial.** ¿Un registro por estado de cuenta (corte, límite,
   saldo total, pago mínimo, pago sin intereses) más los abonos contra él, o solo un pago
   por mes?
2. **Moneda.** ¿Solo MXN o también USD? Afecta el esquema de pagos.
3. **Invitaciones al hogar.** Hoy agregar miembros se hace desde el dashboard: no hay
   políticas de insert en `home_household_members` a propósito.
