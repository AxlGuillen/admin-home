# Módulo: mcp

## Dominio

Servidor MCP **de solo lectura** sobre los datos del hogar, expuesto por HTTP y
autenticado con el servidor OAuth 2.1 de Supabase. Existe para que un LLM conteste
preguntas concretas sin redescubrir las reglas del dominio en cada consulta.

El plan completo está en [`docs/mcp-plan.md`](../../../docs/mcp-plan.md).

## Contrato público

Dos entry points: `index.ts` (cliente + servidor) y `server.ts` (solo servidor).

| Export | Dónde | Para qué |
| --- | --- | --- |
| `MCP_PATH`, `PROTECTED_RESOURCE_PATH` | `index.ts` | Rutas, para que el route handler y el metadata no se desincronicen |
| `mcpResourceUrl`, `supabaseAuthIssuer` | `index.ts` | Identificadores derivados de `APP_URL` |
| `mcpHandler`, `verifyToken` | `server.ts` | Lo que monta `src/app/api/[transport]/route.ts` |

## Herramientas

| Tool | Para qué |
| --- | --- |
| `list_cards` | Tarjetas, dueño, ciclo, límite y **qué meses hay cargados** |
| `get_household_overview` | Totales, costo del crédito, deuda, utilización, suscripciones |
| `get_card_detail` | Una tarjeta a fondo: meses, categorías, recurrentes, duplicados |
| `search_movements` | Filtros por comercio, fecha, monto, categoría, tarjeta, persona |
| `spending_by_category` | Reparto con porcentaje del total |
| `spending_by_month` | Serie mensual con la categoría dominante |
| `find_recurring_merchants` | El goteo que la lista de suscripciones no ve |
| `find_duplicate_charges` | Mismo comercio y monto dentro de una ventana de días |

Todas devuelven **pesos**, no centavos, y todas agregan antes de listar:
`search_movements` regresa el resumen completo y solo los primeros `limit`
movimientos. Son ~2,000 movimientos; devolverlos enteros se come la ventana de
contexto y el modelo empieza a inventar.

## Invariantes

1. **La caché del ledger va indexada por hogar. Es corrección, no rendimiento.**
   Una instancia de Node en Vercel se reutiliza entre requests de usuarios distintos,
   y **RLS protege el fetch, no la memoria**: en cuanto el ledger está en una variable
   de módulo es un objeto JS sin política pegada. Sin la clave, el segundo usuario en
   caer en la instancia caliente recibe los datos del primero. Lo fija
   `ledger-cache.test.ts` — si tocas la caché, ese test es el que avisa.
   - La clave es el **conjunto ordenado** de hogares, no uno solo:
     `home_private.user_household_ids()` devuelve un `setof`, así que RLS entrega la
     unión de los hogares del usuario.
2. **Nada de `service_role`.** El cliente de Supabase se construye con el token del
   request (`clientForToken`), así que el MCP ve exactamente lo que ve la app. El
   proyecto de Supabase es compartido con las apps `ra_` y `adala_`: esa llave las
   expondría a todas.
3. **El ledger es perezoso.** `get_household_overview` y `get_card_detail` no lo tocan;
   cargarlo siempre eran ~2,000 filas tiradas a la basura en cada llamada.
4. **Las reglas del dominio están en los filtros, no en el prompt.** Por defecto
   "gasto" ya excluye transferencias, pagos de tarjeta e ingresos, y de los cargos a
   crédito solo cuenta la clase `regular`. Eso es lo que un `execute_sql` crudo no sabe
   y por lo que este servidor existe.
5. **Solo lectura.** Ninguna herramienta escribe, y todas llevan `readOnlyHint`.

## Autenticación

Supabase es el authorization server; esta app es el resource server. El token que
llega en el `Authorization: Bearer` es un **JWT nativo de Supabase**, así que
`auth.uid()` resuelve y **las políticas de RLS aplican sin cambiar ni una**.

`verifyToken` cierra tres puertas, en orden:

1. `auth.getUser(token)` contra GoTrue — autoritativo, detecta revocación.
2. El token debe traer `client_id`. Uno de sesión normal de la app web no lo trae:
   no pasó por consentimiento y no debe abrir el conector.
3. El `client_id` debe estar en `MCP_OAUTH_CLIENT_IDS`, y el usuario debe pertenecer
   a un hogar. Supabase emite `aud: "authenticated"` para todo el proyecto, así que
   **la audiencia no prueba nada**: el allowlist es lo que de verdad acota.

Hay una caché de identidad de 60 s indexada por hash del token, para no pagar el
round trip en cada herramienta de una misma conversación. El precio es que revocar
tarda hasta 60 s en surtir efecto.

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `server.ts` | `mcpHandler` + las instrucciones que lee el LLM |
| `auth.ts` | `verifyToken`: getUser, allowlist de cliente, gate de hogar |
| `supabase.ts` | `clientForToken` (el puente a RLS) y `verifierClient` |
| `context.ts` | El `McpContext` por request, con el ledger perezoso |
| `tools.ts` | Las 8 herramientas |
| `ledger.ts` | Crédito y débito fundidos en una lista, paginada y cacheada por hogar |
| `filters.ts` | Las reglas del dominio como filtros |
| `summarize.ts` | Agregaciones; centavos → pesos |

El cómputo pesado no vive aquí: se importa de `@/modules/finance/analytics-core`, que
recibe el cliente de Supabase en vez de crearlo. Así la app y el MCP no pueden
divergir en qué cuenta como gasto.
