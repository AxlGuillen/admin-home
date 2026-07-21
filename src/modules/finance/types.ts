import type { z } from "zod";

import type {
  accountMovementSchema,
  accountStatementSchema,
  cardInputSchema,
  cardSchema,
  statementImportSchema,
  statementSchema,
  statementTransactionSchema,
} from "./schemas";

export type Card = z.infer<typeof cardSchema>;

export type CardInput = z.infer<typeof cardInputSchema>;

export type Statement = z.infer<typeof statementSchema>;

export type StatementTransaction = z.infer<typeof statementTransactionSchema>;

export type StatementImport = z.infer<typeof statementImportSchema>;

export type StatementWithTransactions = Statement & {
  transactions: StatementTransaction[];
};

export type AccountStatement = z.infer<typeof accountStatementSchema>;

export type AccountMovement = z.infer<typeof accountMovementSchema>;

export type AccountStatementWithMovements = AccountStatement & {
  movements: AccountMovement[];
};

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
