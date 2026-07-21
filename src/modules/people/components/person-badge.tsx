import { colorFromId } from "@/lib/colors";

import type { Person } from "../types";

/** Etiqueta de persona: punto de color + nombre. */
export function PersonBadge({ person }: { person: Person }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: person.color ?? colorFromId(person.id) }}
      />
      {person.name}
    </span>
  );
}
