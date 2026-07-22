import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeading } from "@/components/blueprint";
import { Button } from "@/components/ui/button";
import { FinanceOverviewDashboard } from "@/modules/finance";
import { getFinanceOverview } from "@/modules/finance/server";

export const metadata = { title: "Análisis · Finanzas · Admin Home" };

export default async function FinanceAnalysisPage() {
  const overview = await getFinanceOverview();

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
      <PageHeading
        kicker="FINANZAS"
        title="Análisis"
        subtitle="Consumo del hogar y fugas de capital, todos los meses."
      />

      <FinanceOverviewDashboard data={overview} />
    </div>
  );
}
