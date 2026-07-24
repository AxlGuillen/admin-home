import Link from "next/link";

import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

// Rendered on the server, which runs in UTC in production; hence the explicit time zone.
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
  owner: Person | null;
  people: Person[];
}) {
  const isArchived = card.archivedAt !== null;
  const payment = nextPaymentLabel(card);

  const color = card.color ?? "var(--muted-foreground)";

  return (
    <div
      className={`m-base flex items-start gap-4 p-[18px] transition-shadow duration-[var(--dur)] hover:shadow-[var(--sh-raise)] ${isArchived ? "opacity-60" : ""}`}
    >
      <span
        aria-hidden
        className="border-line mt-0.5 grid size-9 flex-none place-items-center rounded-[var(--r-el-sm)] border"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
        }}
      >
        <CreditCard className="size-[18px]" strokeWidth={1.5} />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/finance/${card.id}`}
            className="text-[13px] leading-none font-extrabold hover:underline"
          >
            {card.name}
          </Link>
          <Badge variant="secondary">{CARD_TYPE_LABELS[card.type]}</Badge>
          {isArchived && <Badge variant="outline">Archivada</Badge>}
          {owner ? (
            <PersonBadge person={owner} />
          ) : (
            <span className="text-ink-mut text-[11px]">Sin dueño</span>
          )}
        </div>

        {(card.issuer || card.lastFour) && (
          <p className="text-ink-mut text-[11px]">
            {card.issuer}
            {card.issuer && card.lastFour && " · "}
            {card.lastFour && `•••• ${card.lastFour}`}
          </p>
        )}

        {card.description && (
          <p className="text-ink-mut text-[11px]">
            {card.description}
          </p>
        )}

        {isCreditCard(card) && (
          <p className="text-ink-mut text-[11px]">
            Corte día {card.cutDay} · Pago día {card.paymentDay}
            {card.creditLimitCents !== null &&
              ` · Límite ${formatMoney(card.creditLimitCents)}`}
          </p>
        )}

        {payment && (
          <p className="text-brand-700 text-[11px] font-bold">{payment}</p>
        )}
      </div>

      <CardActions card={card} people={people} />
    </div>
  );
}
