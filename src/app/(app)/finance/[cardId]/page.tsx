import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDetailDashboard } from "@/modules/finance";
import { getCardDetail } from "@/modules/finance/server";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const detail = await getCardDetail(cardId);
  if (!detail) notFound();

  const { card } = detail;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="size-8 shrink-0 rounded-full"
          style={{ background: card.color ?? "var(--chart-1)" }}
        />
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {card.name}
            <Badge variant="outline">
              {card.isCredit ? "Crédito" : "Débito"}
            </Badge>
          </h1>
          {card.issuer && (
            <p className="text-muted-foreground text-sm">{card.issuer}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/finance/analisis">← Análisis</Link>
        </Button>
      </div>

      <CardDetailDashboard data={detail} />
    </div>
  );
}
