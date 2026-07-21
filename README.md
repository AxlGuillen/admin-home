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

## Módulos

| Módulo    | Estado                                      |
| --------- | ------------------------------------------- |
| `finance` | Andamiaje listo, modelo de datos pendiente. |

## Documentación

- [`AGENTS.md`](AGENTS.md) — reglas para trabajar en este repo (humanos y agentes).
- [`docs/architecture.md`](docs/architecture.md) — por qué está armado así.
- `src/modules/<nombre>/CLAUDE.md` — contrato de cada módulo.
