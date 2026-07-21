import type { z } from "zod";

import type { cardInputSchema, cardSchema } from "./schemas";

export type Card = z.infer<typeof cardSchema>;

export type CardInput = z.infer<typeof cardInputSchema>;

/** Credit card: the cycle is guaranteed by the DB CHECK. */
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
