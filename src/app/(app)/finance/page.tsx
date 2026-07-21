import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Finanzas · Admin Home" };

export default function FinancePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-muted-foreground text-sm">
          Tarjetas de débito y crédito, y su historial de pagos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendiente de definir</CardTitle>
          <CardDescription>
            El modelo de datos de tarjetas y pagos aún no está decidido. Las
            preguntas abiertas están en{" "}
            <code className="text-xs">src/modules/finance/CLAUDE.md</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          El andamiaje del módulo ya existe: schemas con Zod, utilidades de dinero
          en centavos y sus tests.
        </CardContent>
      </Card>
    </div>
  );
}
