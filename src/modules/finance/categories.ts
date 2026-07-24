export const CATEGORY_LABELS: Record<string, string> = {
  shopping: "Compras",
  groceries: "Súper",
  services: "Servicios",
  restaurant: "Restaurante",
  transport: "Transporte",
  advertising: "Publicidad",
  subscription: "Suscripciones",
  health: "Salud",
  fees: "Comisiones",
  education: "Educación",
  entertainment: "Entretenimiento",
  travel: "Viajes",
  income: "Ingreso",
  transfer: "Transferencia",
  card_payment: "Pago de tarjeta",
  payment: "Pago",
  refund: "Reembolso",
  other: "Otro",
};

export const categoryLabel = (key: string) => CATEGORY_LABELS[key] ?? key;

// Escala categórica de acero fría (SKIN): un eje, sin arcoíris, sin reusar marca
// ni colores de estado. Se aplica ordenada por monto (mayor = más oscuro).
export const CATEGORY_COLORS = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
];

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
export const monthLabel = (key: string) =>
  MONTHS[Number(key.split("-")[1]) - 1] ?? key;
