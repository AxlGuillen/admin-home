import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MODULES } from "@/shared/config/modules";

export default function DashboardPage() {
  const modules = MODULES.filter((m) => m.id !== "dashboard");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-muted-foreground text-sm">
          Módulos disponibles para administrar la casa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link key={mod.id} href={mod.href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <CardHeader>
                <mod.icon className="text-muted-foreground size-5" />
                <CardTitle>{mod.label}</CardTitle>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
