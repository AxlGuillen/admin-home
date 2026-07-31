# Admin Home

App personal para administrar y llevar registro de varios ámbitos de la casa.
Monolito modular en Next.js 16 con Supabase.

## Arranque

```bash
npm install
cp .env.example .env.local   # y llena las variables
npm run dev
```

Necesitas una cuenta en Supabase Auth para entrar. Créala desde el dashboard del proyecto
(Authentication → Users → Add user), con "Auto Confirm User" activado.

## Comandos

| Comando             | Qué hace                                            |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server con Turbopack.                           |
| `npm run build`     | Build de producción.                                |
| `npm run check`     | typecheck + lint + tests. Úsalo antes de commitear.  |
| `npm test`          | Vitest en watch.                                    |
| `npm run db:types`  | Regenera los tipos de la BD.                        |

## CI y review automático

Dos workflows en `.github/workflows/`:

| Workflow | Qué hace | ¿Bloquea el merge? |
| -------- | -------- | ------------------ |
| `ci.yml` | `npm run check` (tsc + eslint + vitest) y `npm run build`. | Sí, si activas la protección de rama. |
| `claude-code-review.yml` | Claude revisa el PR y comenta hallazgos. | No, a propósito: es una opinión más. |

### Activar el CI

1. Sube `main` y hazla la rama por defecto (ver abajo).
2. Settings → Branches → Add rule sobre `main` → **Require status checks to pass** →
   marca `check`.

### Activar el review de Claude

Usa **tu suscripción de Claude Code** (Pro o Max), no la API de Anthropic. GitHub Actions
corre en servidores de GitHub y no tiene tu sesión local, así que necesita un token propio.

```bash
# 1. Instala la GitHub App en el repo
#    https://github.com/apps/claude

# 2. Genera el token desde tu suscripción (abre el navegador para autorizar)
claude setup-token

# 3. Guárdalo como secret; pega el token cuando lo pida
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo AxlGuillen/admin-home
```

El token **caduca**. Si un día el job falla con error de autenticación sin que hayas
tocado nada, repite los pasos 2 y 3: es la causa más probable.

Alternativa, si prefieres pagar por tokens en vez de consumir tu plan: crea una key en
`console.anthropic.com`, guárdala como `ANTHROPIC_API_KEY` y cambia esa línea del workflow
por `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`.

> **No confundir con el Code Review gestionado de Anthropic**
> (`claude.ai/admin-settings/claude-code`), que publica reviews inline sin workflow pero
> **requiere plan Team o Enterprise**. Este repo usa la GitHub Action.

El repo es público, así que el workflow ignora PRs de forks: sin esa guarda cualquiera
podría consumir tu plan abriendo PRs.

## Conector MCP

El servidor MCP se sirve en `/api/mcp` y se autentica con el **servidor OAuth 2.1 de
Supabase**, así que los tokens son JWT nativos y RLS aplica sin cambiar ninguna política.
Detalles en [`src/modules/mcp/CLAUDE.md`](src/modules/mcp/CLAUDE.md).

### Configuración (una sola vez)

Todo esto es de UI; nada vive en el repo.

**Supabase → Authentication → URL Configuration**

1. **Anota el Site URL actual antes de tocarlo**: es ajuste **de proyecto** y este
   proyecto Supabase es compartido con las apps `ra_` y `adala_`.
2. Ponlo en el dominio de producción de esta app.

**Supabase → Authentication → OAuth Server**

3. Enciende **OAuth 2.1 server** (hoy la discovery responde `feature_disabled`).
4. **Authorization Path** = `/oauth/consent`.
5. **Deja Dynamic Client Registration apagada.** Supabase emite `aud: "authenticated"`
   para todo el proyecto, así que con DCR encendida cualquiera podría registrar un
   cliente y su token llegaría a este endpoint.

**Supabase → Authentication → OAuth Apps**

6. Cliente nuevo `Claude`, con los redirect URIs **exactos** que muestra Claude al
   agregar el conector (no admiten comodines). Copia el `client_id` y el secreto: el
   secreto se ve una sola vez.

**Vercel → Environment Variables**

Obligatorias:

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Opcionales:

- `MCP_OAUTH_CLIENT_IDS` — qué clientes OAuth pueden entrar al MCP. Vacío deja
  pasar a cualquiera del proyecto Supabase, que es compartido: ponlo en cuanto
  tengas el `client_id`.
- `APP_URL` — solo con dominio propio. Si no está, se deriva de
  `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel inyecta sola.

Ni `service_role` ni `REDIS_URL`.

> El identificador del recurso apunta siempre al **dominio de producción**, incluso
> desde un preview. Es a propósito —si cambiara por deploy, el conector tendría que
> reautorizarse cada vez— pero significa que el MCP solo funciona contra producción.

**Claude → Settings → Connectors → Add custom connector**

7. URL `https://<dominio>/api/mcp`, y en *Advanced settings* el client id y el secreto.

### Comprobar que quedó

`GET /api/health` revisa las tres cosas que se rompen en silencio: que la discovery de
Supabase siga viva, que el documento del recurso apunte bien, y que `/api/mcp` sin token
conteste **401 con `resource_metadata`** — sin ese header ningún cliente descubre el
authorization server.

## Módulos

| Módulo    | Estado                                        |
| --------- | --------------------------------------------- |
| `finance` | Tarjetas, estados de cuenta y análisis.       |
| `people`  | Personas del hogar, como etiqueta.            |
| `mcp`     | Servidor MCP remoto de solo lectura.          |

## Documentación

- [`AGENTS.md`](AGENTS.md) — reglas para trabajar en este repo (humanos y agentes).
- [`docs/architecture.md`](docs/architecture.md) — por qué está armado así.
- `src/modules/<nombre>/CLAUDE.md` — contrato de cada módulo.
