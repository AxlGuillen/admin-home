import { ArrowLeft } from "lucide-react";
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
    <div className="ah-view">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-3.5 h-auto px-0 py-1"
      >
        <Link href="/finance">
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Finanzas
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className="size-3.5 shrink-0 rounded-full"
          style={{ background: card.color ?? "var(--cat-1)" }}
        />
        <h1 className="text-4xl">{card.name}</h1>
        <Badge variant="outline">{card.isCredit ? "Crédito" : "Débito"}</Badge>
        {card.issuer && (
          <span className="text-muted-foreground text-sm">{card.issuer}</span>
        )}
      </div>

      <CardDetailDashboard data={detail} />
    </div>
  );
}
