import type { LucideIcon } from "lucide-react";
import { CreditCard, LayoutDashboard, Users } from "lucide-react";

/**
 * Registro de módulos del monolito. Es lo único que sabe qué módulos existen:
 * la navegación se construye desde aquí, así que agregar un módulo a la sidebar
 * es agregar una línea a esta lista.
 */
export type ModuleDescriptor = {
  /** Slug del módulo. Coincide con el directorio en `src/modules/` y con la ruta. */
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: "activo" | "planeado";
};

export const MODULES: ModuleDescriptor[] = [
  {
    id: "dashboard",
    label: "Inicio",
    description: "Resumen general de la casa.",
    href: "/",
    icon: LayoutDashboard,
    status: "activo",
  },
  {
    id: "finance",
    label: "Finanzas",
    description: "Tarjetas de débito y crédito, y su historial de pagos.",
    href: "/finance",
    icon: CreditCard,
    status: "activo",
  },
  {
    id: "people",
    label: "Personas",
    description: "Quién vive en la casa, para etiquetar y filtrar.",
    href: "/people",
    icon: Users,
    status: "activo",
  },
];

export const ACTIVE_MODULES = MODULES.filter((m) => m.status === "activo");
