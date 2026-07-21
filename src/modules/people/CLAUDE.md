# Módulo: people

## Dominio

Las personas del hogar. Existen para **etiquetar y filtrar**: saber de quién es cada
tarjeta, cada gasto, cada pendiente.

## Invariante principal

**Una persona NO es un permiso.** Quién ve qué lo decide RLS por `household_id`, y ahí
todos los miembros del hogar ven y editan todo. Si alguien pide "que solo Fulano vea sus
tarjetas", eso es un cambio de política de RLS, no de este módulo — y hay que preguntarlo
antes, porque va en contra de cómo está diseñado hoy.

## Contrato público

Dos entry points: `index.ts` (cliente + servidor) y `server.ts` (solo servidor).

| Export | Dónde | Para qué |
| ------ | ----- | -------- |
| `listPeople`, `toPerson` | `server.ts` | Lecturas. Importan `server-only`. |
| `createPerson`, `updatePerson`, `deletePerson` | actions | CRUD. |
| `PersonBadge` | componente | Punto de color + nombre. |
| `PersonFormDialog`, `PersonItem`, `ColorPicker` | componentes | UI de gestión. |
| `Person`, `personSchema`, `personInputSchema` | tipos/schemas | Modelo. |

## Tablas

| Tabla | Descripción | RLS |
| ----- | ----------- | --- |
| `home_people` | Persona del hogar: nombre, color, `user_id` opcional. | miembros del `household_id` |

## Invariantes

1. **Una persona no necesita cuenta.** `user_id` es opcional, para registrar a quien vive
   en la casa pero no usa la app. Si después se crea su cuenta, se liga sin migrar nada.
2. **Nombre único por hogar, sin distinguir mayúsculas.** Índice
   `home_people_household_name_key` sobre `(household_id, lower(name))`, para que "Axl" y
   "axl" no acaben siendo dos personas y ensucien el filtro. El código 23505 de Postgres
   se traduce a un error de campo, no a un 500.
3. **Borrar una persona no borra sus cosas.** Las FKs que la apuntan son
   `on delete set null`: sus tarjetas quedan sin dueño y se reasignan. Cualquier tabla
   nueva que referencie a `home_people` debe seguir la misma regla.
4. Las actions revalidan todo el árbol (`revalidatePath("/", "layout")`) porque las
   personas se pintan en varios módulos.
