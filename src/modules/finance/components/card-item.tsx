import { Badge } from "@/components/ui/badge";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { PersonBadge, type Person } from "@/modules/people";
import {
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_TIME_ZONE,
} from "@/shared/config/household";

import {
  daysUntil,
  formatCivilDate,
  nextPaymentDate,
  todayIn,
} from "../billing-cycle";
import { formatMoney } from "../money";
import { CARD_TYPE_LABELS } from "../schemas";
import { isCreditCard, type Card } from "../types";
import { CardActions } from "./card-actions";

/**
 * Esto se renderiza en el servidor, que en producción corre en UTC. Por eso la
 * zona horaria es explícita: sin ella, a partir de las 6pm hora de México la
 * cuenta de días saldría corrida.
 */
function nextPaymentLabel(card: Card): string | null {
  if (!isCreditCard(card)) return null;

  const ref = todayIn(HOUSEHOLD_TIME_ZONE);
  const due = nextPaymentDate(card.cutDay, card.paymentDay, ref);
  const days = daysUntil(due, ref);

  const when =
    days === 0 ? "es hoy" : days === 1 ? "es mañana" : `faltan ${days} días`;

  return `Próximo pago: ${formatCivilDate(due, HOUSEHOLD_LOCALE)} — ${when}`;
}

export function CardItem({
  card,
  owner,
  people,
}: {
  card: Card;
  /** Persona dueña, ya resuelta por la página. `null` si no tiene asignada. */
  owner: Person | null;
  people: Person[];
}) {
  const isArchived = card.archivedAt !== null;
  const payment = nextPaymentLabel(card);

  return (
    <UICard className={isArchived ? "opacity-60" : undefined}>
      <CardContent className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-1 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: card.color ?? "var(--muted-foreground)" }}
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="leading-none font-medium">{card.name}</h3>
            <Badge variant="secondary">{CARD_TYPE_LABELS[card.type]}</Badge>
            {isArchived && <Badge variant="outline">Archivada</Badge>}
            {owner ? (
              <PersonBadge person={owner} />
            ) : (
              <span className="text-muted-foreground text-sm">Sin dueño</span>
            )}
          </div>

          {(card.issuer || card.lastFour) && (
            <p className="text-muted-foreground text-sm">
              {card.issuer}
              {card.issuer && card.lastFour && " · "}
              {card.lastFour && `•••• ${card.lastFour}`}
            </p>
          )}

          {card.description && (
            <p className="text-muted-foreground text-sm">{card.description}</p>
          )}

          {isCreditCard(card) && (
            <p className="text-muted-foreground text-sm">
              Corte día {card.cutDay} · Pago día {card.paymentDay}
              {card.creditLimitCents !== null &&
                ` · Límite ${formatMoney(card.creditLimitCents)}`}
            </p>
          )}

          {payment && <p className="text-sm font-medium">{payment}</p>}
        </div>

        <CardActions card={card} people={people} />
      </CardContent>
    </UICard>
  );
}
