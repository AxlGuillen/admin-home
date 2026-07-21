/**
 * Contrato público del módulo de personas. Seguro de importar desde cliente y
 * servidor. Las lecturas viven en `@/modules/people/server` (ver ese archivo).
 *
 * Las personas son etiquetas del hogar, no permisos: quién ve qué lo decide RLS
 * por `household_id`, y ahí todos los miembros ven todo.
 */
export { createPerson, deletePerson, updatePerson } from "./actions";
export { personInputSchema, personSchema } from "./schemas";
export type { Person, PersonInput } from "./types";

export { ColorPicker } from "./components/color-picker";
export { PersonBadge } from "./components/person-badge";
export { PersonFormDialog } from "./components/person-form-dialog";
export { PersonItem } from "./components/person-item";
