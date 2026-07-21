# Módulo: _template

> Plantilla. **No la importes desde ningún lado.** Cópiala para crear un módulo nuevo:
> `cp -r src/modules/_template src/modules/<nombre>` y reescribe este archivo.

## Dominio

Una o dos frases: qué problema del hogar resuelve este módulo y qué queda fuera de su alcance.

## Contrato público

Dos entry points, y nada más del módulo puede importarse desde fuera:

- `index.ts` — seguro en cliente y servidor: schemas, tipos, actions, componentes.
- `server.ts` — solo servidor: las queries (importan `server-only`).

| Export | Dónde | Para qué |
| ------ | ----- | -------- |
|        |       |          |

## Tablas

| Tabla | Descripción | RLS |
| ----- | ----------- | --- |
| `home_<nombre>_*` |  | dueño por `user_id` |

## Invariantes

Reglas que siempre se cumplen. Ejemplos del tipo de cosa que va aquí:

- Los montos se guardan en centavos (`integer`), nunca en `float`.
- Borrar un registro padre borra sus hijos (`on delete cascade`).

## Decisiones tomadas

Registra aquí las decisiones de diseño no obvias y **por qué**, para que la próxima
sesión no las revierta sin querer.
