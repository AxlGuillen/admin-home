import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FinanceOverviewDashboard } from "@/modules/finance";
import { getFinanceOverview } from "@/modules/finance/server";

export const metadata = { title: "Análisis · Finanzas · Admin Home" };

export default async function FinanceAnalysisPage() {
  const overview = await getFinanceOverview();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Análisis</h1>
          <p className="text-muted-foreground text-sm">
            En qué se va el dinero del hogar y dónde hay fugas.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/finance">Ver tarjetas</Link>
        </Button>
      </div>

      <FinanceOverviewDashboard data={overview} />
    </div>
  );
}
