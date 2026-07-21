"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
          {/* In prod Next replaces the message with a digest; it's the only thing the user can report. */}
          <p className="text-muted-foreground font-mono text-xs break-all">
            {error.digest ?? error.message}
          </p>
          <Button onClick={reset}>Reintentar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
