"use client";

import { useEffect } from "react";
import { CircleHelp } from "lucide-react";

import { hasSeenTour, markTourSeen } from "@/lib/tour-storage";
import { cn } from "@/lib/utils";

export type TourStep = {
  /** Valor del atributo `data-tour` del elemento a resaltar. */
  anchor: string;
  title: string;
  body: string;
};

// Las definiciones deben ser constantes de módulo, no objetos inline en el
// render: TourAutoStart las usa como dependencia del efecto.
export type TourDefinition = {
  /** Clave del gating por dispositivo (`ah-tour:<screen>:vN`). */
  screen: string;
  version?: number;
  steps: TourStep[];
};

// driver.js solo permite un tour a la vez; el flag evita el doble arranque
// (doble click en el botón, StrictMode montando el efecto dos veces).
let active = false;

export async function startTour({
  screen,
  version = 1,
  steps,
}: TourDefinition): Promise<void> {
  if (active) return;

  // Una pantalla sin datos no tiene todos los anclajes. Sin filtrar, driver.js
  // muestra el paso huérfano flotando en el centro, sin contexto.
  const present = steps.filter((s) =>
    document.querySelector(`[data-tour="${s.anchor}"]`),
  );
  if (present.length === 0) return;

  // Dinámico a propósito: el tour no paga bundle hasta que alguien lo abre.
  const { driver } = await import("driver.js");

  // La penumbra y el borde viven como tokens para seguir el tema.
  const css = getComputedStyle(document.documentElement);
  const overlayColor = css.getPropertyValue("--tour-overlay-color").trim();
  const overlayOpacity = Number(css.getPropertyValue("--tour-overlay-opacity"));

  active = true;
  try {
    driver({
      showProgress: present.length > 1,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Listo",
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      // El movimiento del motor (--dur-panel), no los 400ms de driver.
      duration: 240,
      // El recorte abraza el radio de card; a 5px deja cuñas en las esquinas.
      stageRadius: 18,
      ...(overlayColor ? { overlayColor } : {}),
      ...(Number.isFinite(overlayOpacity) ? { overlayOpacity } : {}),
      onDestroyed: () => {
        active = false;
        markTourSeen(screen, version);
      },
      steps: present.map((s) => ({
        element: `[data-tour="${s.anchor}"]`,
        popover: { title: s.title, description: s.body },
      })),
    }).drive();
  } catch {
    // Sin el reset, un drive() fallido deja el flag puesto y el botón de
    // ayuda muere hasta recargar (pasó con un HMR a mitad de un tour).
    active = false;
  }
}

/** Arranca solo la primera vez que este dispositivo ve la pantalla. */
export function TourAutoStart({ tour }: { tour: TourDefinition }) {
  useEffect(() => {
    if (hasSeenTour(tour.screen, tour.version)) return;
    // Tras el primer paint: las gráficas y los datos montan después del frame
    // inicial y sus anclajes aún no existen.
    const id = window.setTimeout(() => void startTour(tour), 400);
    return () => window.clearTimeout(id);
  }, [tour]);

  return null;
}

/** Botón de ayuda: relanza el tour de la pantalla que lo renderiza. */
export function TourButton({
  tour,
  className,
}: {
  tour: TourDefinition;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => void startTour(tour)}
      aria-label="Ver la guía de esta pantalla"
      title="Guía de la pantalla"
      className={cn(
        "ctl border-line bg-surface text-ink-2 hover:bg-line-2 grid size-9 flex-none place-items-center rounded-[var(--r-el)] border",
        className,
      )}
    >
      <CircleHelp className="size-4" strokeWidth={2} />
    </button>
  );
}
