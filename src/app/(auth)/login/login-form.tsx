"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="m-base relative z-10 w-[min(408px,92vw)] px-9 pt-10 pb-8 shadow-[var(--sh-raise)]"
    >
      <input type="hidden" name="next" value={next} />

      <div className="text-brand-700 mb-3 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
        ACCESO
      </div>
      <h1 className="mb-1.5 text-[25px] leading-none tracking-[-0.025em]">
        Admin Home
      </h1>
      <p className="text-ink-mut mb-6 text-[12.5px]">
        Administración y registro de los ámbitos de la casa.
      </p>

      <div className="mb-4 grid gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
        />
      </div>

      <div className="mb-6 grid gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="text-ink-mut hover:text-ink absolute inset-y-0 right-0 flex items-center px-3"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-danger mb-4 text-xs font-semibold">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-[var(--r-el)] text-[13px] font-bold"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <div className="text-ink-mut mt-5 flex justify-between font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
        <span>v0.1</span>
        <span>MÓDULO · HOGAR</span>
      </div>
    </form>
  );
}
