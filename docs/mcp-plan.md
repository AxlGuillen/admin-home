# Plan · MCP de consulta de Admin Home

> Objetivo: que un LLM conteste preguntas concretas sobre las finanzas del hogar
> sin tener que redescubrir las reglas del dominio en cada consulta.

## Por qué uno propio si ya está el MCP de Supabase

El MCP de Supabase con `execute_sql` ya lee toda la base. Lo que no hace es
**saber el dominio**. Para contestar "¿cuánto gasté en súper?" hay que saber que:

- los montos están en **centavos**;
- solo `movement_class='regular'` es gasto real (interés, IVA y MSI van aparte);
- crédito y débito son **modelos distintos** (`statements` vs `account_statements`);
- `transfer` y `card_payment` mueven dinero, no lo gastan — sumarlos duplica;
- "hoy" es en `HOUSEHOLD_TIME_ZONE`, nunca la hora del proceso.

Un LLM con SQL crudo se equivoca en alguna y el resultado *parece* razonable.
El MCP propio codifica esas reglas una sola vez.

## Decisiones

### Autenticación — refresh token local

**No se usa `service_role`.** Brinca RLS, y el proyecto Supabase es compartido
con `ra_` y `adala_`: filtrar esa llave expone las otras apps, no solo el hogar.

`npm run mcp:login` pide credenciales una vez y guarda el `refresh_token` en
`~/.admin-home/session.json` (chmod 600). El servidor renueva el access token.
**RLS aplica igual que en la app.**

### Transporte — stdio local

El servidor corre en la máquina del usuario, lanzado por el cliente MCP. No hay
endpoint HTTP: sería un servicio público con datos financieros del hogar.

### Alcance — solo lectura en v1

Sin herramientas de escritura. La carga de estados de cuenta sigue siendo el
flujo semi-manual, que ya tiene validación de reconciliación.

### Ubicación — dentro de este repo

`mcp/` comparte `database.types.ts`, los schemas de Zod y la capa de cómputo.
Un repo aparte obligaría a duplicar tipos y a sincronizarlos a mano.

## Fases

### Fase 1 · Desacoplar cómputo de fetch ✅

`analytics.ts` y `queries.ts` importan `server-only` y llaman `requireHousehold()`:
están atados al request de Next. El MCP es un proceso Node plano y no puede
importarlos.

Se parte en tres capas:

| Capa | Archivo | Depende de |
| --- | --- | --- |
| Tipos | `analytics-types.ts` | nada |
| Cómputo | `analytics-compute.ts` | nada (funciones puras) |
| Fetch | `analytics-fetch.ts` | un cliente Supabase **recibido**, no creado |
| Wrapper | `analytics.ts` | `server-only` + `requireHousehold()` |

Beneficio inmediato: el cómputo se prueba con Vitest. Hoy la lógica de
agregación no tiene un solo test.

### Fase 2 · Servidor MCP con el núcleo de herramientas ✅

Vive en [`mcp/`](../mcp/README.md), registrado en `.mcp.json` como `admin-home`.

| Tool | Para qué |
| --- | --- |
| `list_cards` | Tarjetas, dueño, ciclo, límite, **meses cargados** |
| `get_household_overview` | Totales, deuda, utilización, fugas |
| `get_card_detail` | Una tarjeta: meses, categorías, recurrentes |
| `search_movements` | Filtros por comercio, fecha, monto, categoría, tarjeta, persona |
| `spending_by_category` | Con período y agrupación |
| `spending_by_month` | Serie temporal |
| `find_recurring_merchants` | El goteo que la lista de suscripciones no ve |
| `find_duplicate_charges` | Cobros dobles |

Tres cosas salieron distinto a lo planeado y valen la pena:

- **Todo sale en pesos, no en centavos.** El resto del sistema usa centavos, pero
  aquí el consumidor es un LLM que lee el número tal cual: `196051` se convierte
  en una respuesta con dos órdenes de magnitud de más.
- **`scope` explícito para las clases de cargo.** `regular` (default) es el que
  cuadra con el corte; `with_msi` suma las parcialidades; `all` agrega comisiones
  y la compra MSI completa, **que se cuenta doble con sus parcialidades**.
- **Paginación obligatoria en la lectura.** PostgREST corta en 1,000 filas y no
  avisa: sin `.range()` los meses viejos simplemente no existían.

### Fase 3 · Recurso de contexto

Un MCP *resource* que el LLM lee antes de responder:

- glosario del dominio (qué cuenta como gasto y qué no);
- **cobertura real**: qué meses tiene cargados cada tarjeta;
- huecos conocidos (falta el corte de marzo de Plata Charly);
- categorías y personas disponibles.

Sin esto el LLM contesta con seguridad sobre meses que no existen.

### Fase 4 · Consultas comparativas

`compare_periods`, `spending_by_person`, `payment_calendar`.

## Riesgo de diseño: el volumen revienta el contexto

Son ~2,000 movimientos. Si una herramienta devuelve todo, se come la ventana y
el modelo alucina.

**Regla:** toda herramienta agrega por defecto y pagina siempre.
`search_movements` devuelve `{ total, sumCents, top: [...], hasMore }`, nunca la
lista completa; el detalle se pide explícitamente.
