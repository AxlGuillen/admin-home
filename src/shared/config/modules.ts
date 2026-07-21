import type { LucideIcon } from "lucide-react";
import { CreditCard, LayoutDashboard, Users } from "lucide-react";

export type ModuleDescriptor = {
  // Must match the directory in `src/modules/` and the route.
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
