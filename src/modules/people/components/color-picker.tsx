"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PALETTE } from "@/lib/colors";

/** Selector de color de la paleta. El valor viaja en un input oculto del form. */
export function ColorPicker({
  name,
  value,
  onChange,
  label = "Color",
}: {
  name: string;
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}) {
  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value ?? ""} />
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Color ${color}`}
            aria-pressed={value === color}
            style={{ backgroundColor: color }}
            className={`size-7 rounded-full transition ${
              value === color
                ? "ring-foreground ring-2 ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={value === null}
        >
          Sin color
        </Button>
      </div>
    </div>
  );
}
