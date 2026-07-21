"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/shared/result";

import { signIn } from "./actions";

async function action(
  _prev: ActionResult<never> | null,
  formData: FormData,
): Promise<ActionResult<never> | null> {
  return signIn(formData);
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Admin Home</CardTitle>
        <CardDescription>Entra con tu correo para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="next" value={next} />

          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state && !state.ok && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
