# MCP de consulta

Servidor MCP **de solo lectura** sobre los datos del hogar, para que un LLM
conteste preguntas concretas sin redescubrir las reglas del dominio en cada
consulta. El plan completo está en [`docs/mcp-plan.md`](../docs/mcp-plan.md).

## Arrancar

```bash
npm run mcp:login
```

Pide correo y contraseña **una sola vez**, y guarda el `refresh_token` en
`~/.admin-home/session.json` con permisos `600`. La contraseña no se escribe en
ningún lado. Vuelve a correrlo si la sesión caduca.

El servidor ya está registrado en `.mcp.json` como `admin-home`; el cliente MCP
lo lanza solo. Para probarlo a mano:

```bash
npm run mcp
```

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

## Decisiones

**Nada de `service_role`.** Brincaría RLS, y el proyecto de Supabase es
compartido con otras apps: filtrar esa llave las expone a todas. Con el refresh
token del usuario, el MCP ve exactamente lo que ve la app.

**Solo stdio.** Corre en la máquina del usuario. Un endpoint HTTP sería un
servicio público con los datos financieros de la casa.

**Las reglas del dominio están en los filtros, no en el prompt.** Por defecto
"gasto" ya excluye transferencias, pagos de tarjeta e ingresos, y de los cargos
a crédito solo cuenta la clase `regular`. Eso es lo que un `execute_sql` crudo
no sabe y por lo que este servidor existe.

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `server.ts` | Entry point stdio + las instrucciones que lee el LLM |
| `tools.ts` | Las 8 herramientas |
| `ledger.ts` | Crédito y débito fundidos en una lista de movimientos, paginada |
| `filters.ts` | Las reglas del dominio como filtros |
| `summarize.ts` | Agregaciones; centavos → pesos |
| `client.ts` | Sesión de Supabase desde el refresh token + check de hogar |
| `session.ts` | Lectura y escritura de `~/.admin-home/session.json` |
| `login.ts` | `npm run mcp:login` |

El cómputo pesado no vive aquí: se importa de
`@/modules/finance/analytics-core`, el entry point del módulo que no depende de
Next. Así la app y el MCP no pueden divergir en qué cuenta como gasto.

`package.json` con `{"type": "module"}` marca esta carpeta como ESM; el resto
del repo lo resuelve Next y no necesita la marca.
