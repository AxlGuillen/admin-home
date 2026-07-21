import type { z } from "zod";

import type { cardInputSchema, cardSchema } from "./schemas";

export type Card = z.infer<typeof cardSchema>;

/** Lo que sale del formulario ya validado y normalizado. */
export type CardInput = z.infer<typeof cardInputSchema>;

/** Tarjeta de crédito: el ciclo está garantizado por el CHECK de la BD. */
export type CreditCard = Card & {
  type: "credito";
  cutDay: number;
  paymentDay: number;
};

export function isCreditCard(card: Card): card is CreditCard {
  return (
    card.type === "credito" && card.cutDay !== null && card.paymentDay !== null
  );
}
