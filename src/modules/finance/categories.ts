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

export const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
export const monthLabel = (key: string) =>
  MONTHS[Number(key.split("-")[1]) - 1] ?? key;
