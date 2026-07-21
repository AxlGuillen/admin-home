"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Cubre todas las rutas del área protegida. Sin esto, un error de red o de
 * Supabase deja al usuario en la pantalla genérica de Next, sin forma de reintentar.
 *
 * `reset()` vuelve a renderizar el segmento: como las páginas son dinámicas, eso
 * reintenta la consulta de verdad.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            No se pudieron cargar los datos. Suele ser un problema temporal de
            conexión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* En producción Next reemplaza el mensaje por un digest; se muestra
              porque es lo único accionable para reportar el fallo. */}
          <p className="text-muted-foreground font-mono text-xs break-all">
            {error.digest ?? error.message}
          </p>
          <Button onClick={reset}>Reintentar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
