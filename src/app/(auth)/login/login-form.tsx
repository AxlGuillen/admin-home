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
      className="blueprint elev-lg bg-surface relative z-10 w-[min(408px,92vw)] px-10 pt-11 pb-9"
    >
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />

      <input type="hidden" name="next" value={next} />

      <div className="text-primary mb-3.5 font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-[0.28em]">
        ACCESO
      </div>
      <h1 className="mb-1.5 text-[38px] leading-none tracking-[-0.02em]">
        Admin Home
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
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
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
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
        <p role="alert" className="text-destructive mb-4 text-sm">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-none text-[15px]"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <div className="text-muted-foreground mt-5 flex justify-between font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-[0.05em]">
        <span>v0.1</span>
        <span>MÓDULO · HOGAR</span>
      </div>
    </form>
  );
}
