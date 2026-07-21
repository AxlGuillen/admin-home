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

## Módulos

| Módulo    | Estado                                      |
| --------- | ------------------------------------------- |
| `finance` | Andamiaje listo, modelo de datos pendiente. |

## Documentación

- [`AGENTS.md`](AGENTS.md) — reglas para trabajar en este repo (humanos y agentes).
- [`docs/architecture.md`](docs/architecture.md) — por qué está armado así.
- `src/modules/<nombre>/CLAUDE.md` — contrato de cada módulo.
