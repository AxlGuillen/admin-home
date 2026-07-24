import { cn } from "@/lib/utils";

type Tone = "default" | "danger" | "ok" | "warn";

const toneText: Record<Tone, string> = {
  default: "text-ink",
  danger: "text-danger",
  ok: "text-ok",
  warn: "text-warn",
};

/** Eyebrow técnica: mono, mayúsculas, tracking. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-ink-mut font-mono text-[11px] font-semibold tracking-[0.06em] uppercase">
      {children}
    </span>
  );
}

type ChipTone = "neutral" | "ok" | "danger" | "dark" | "onBrand";

const chipTone: Record<ChipTone, string> = {
  neutral: "bg-line-2 text-ink-2",
  ok: "bg-[var(--ok-050)] text-ok",
  danger: "bg-[var(--danger-050)] text-danger",
  dark: "bg-ink text-white",
  onBrand: "bg-white/20 text-white",
};

/** Chip de estado/delta (DESIGN §1: 9-10px, 700-800, Display). */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] leading-none font-bold whitespace-nowrap",
        chipTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Encabezado de pantalla. */
export function PageHeading({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-[220px] flex-1">
        {kicker && (
          <div className="text-brand-700 mb-2 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase">
            {kicker}
          </div>
        )}
        <h1 className="text-[25px] leading-none tracking-[-0.025em] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="text-ink-mut mt-1.5 text-[12.5px] text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Stat "desnudo" sin card (fila de header, estilo referencia). */
export function NakedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="tnum text-[25px] leading-none font-extrabold tracking-[-0.02em]">
        {value}
      </span>
      <span className="text-ink-mut font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
        {label}
      </span>
    </div>
  );
}

/** Tipo 1 · KPI en card base neutra. */
export function Kpi({
  label,
  value,
  hint,
  chip,
  tone = "default",
  ticks = false,
}: {
  label: string;
  value: string;
  hint?: string;
  chip?: React.ReactNode;
  tone?: Tone;
  ticks?: boolean;
}) {
  return (
    <div className="m-base flex flex-col p-[14px]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-ink-mut font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
          {label}
        </span>
        {chip}
      </div>
      <span
        className={cn(
          "tnum mt-2 text-[31px] leading-none font-extrabold tracking-[-0.03em]",
          toneText[tone],
        )}
      >
        {value}
      </span>
      {ticks && <span className="ticks text-ink-3 mt-2 block" />}
      {hint && <span className="text-ink-mut mt-1.5 text-[11px]">{hint}</span>}
    </div>
  );
}

/** Panel de contenido (gráfica, lista). Card base. */
export function Panel({
  title,
  subtitle,
  children,
  className,
  right,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={cn("m-base p-[18px]", className)}>
      {(title || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h4 className="text-[13px] leading-none font-extrabold text-balance">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-ink-mut mt-1.5 text-[11px] text-pretty">
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Tipo 2 · Card dominante rellena de marca. EXACTAMENTE UNA por pantalla. */
export function Dominant({
  label,
  value,
  hint,
  chip,
  footer,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  chip?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("m-brand flex flex-col p-[22px]", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-white/75 uppercase">
          {label}
        </span>
        {chip}
      </div>
      <div className="mt-5">
        <div className="tnum text-[33px] leading-none font-extrabold tracking-[-0.02em] text-white [text-shadow:0_0_18px_rgb(255_255_255/0.45)]">
          {value}
        </div>
        <span className="ticks-5 mt-2.5 block text-white/30" />
        {hint && <p className="mt-2 text-[12px] text-white/80">{hint}</p>}
      </div>
      {footer && (
        <div className="mt-4 border-t border-white/15 pt-3">{footer}</div>
      )}
    </div>
  );
}

/** Tipo 3 · Card oscura de contraste. Máximo 1-2 por pantalla, no adyacentes. */
export function Dark({
  label,
  title,
  keyValue,
  keyTone = "danger",
  children,
  className,
}: {
  label: string;
  title?: string;
  keyValue?: string;
  keyTone?: "danger" | "brand";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("m-dark flex flex-col p-[18px]", className)}>
      <span className="text-dark-fg/60 font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
        {label}
      </span>
      {keyValue && (
        <span
          className={cn(
            "tnum mt-2 text-[31px] leading-none font-extrabold tracking-[-0.03em]",
            keyTone === "danger"
              ? "text-danger-on-dark [text-shadow:0_0_16px_rgb(217_45_32/0.55)]"
              : "text-[var(--brand-100)] [text-shadow:0_0_16px_rgb(10_159_212/0.6)]",
          )}
        >
          {keyValue}
        </span>
      )}
      {title && (
        <h4 className="text-dark-fg mt-3 text-[13px] leading-none font-extrabold text-balance">
          {title}
        </h4>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)] as const;
}

/** Gauge de arco de instrumento (240°) con bisel de ticks. SVG propio, sin librería. */
export function Gauge({
  pct,
  label,
  hint,
}: {
  pct: number;
  label: string;
  hint?: string;
}) {
  const clamped = Math.max(0, Math.min(pct, 100));
  const A0 = -120;
  const A1 = 120;
  const end = A0 + ((A1 - A0) * clamped) / 100;
  const cx = 60;
  const cy = 47;
  const r = 38;
  const [x0, y0] = polar(cx, cy, r, A0);
  const [x1, y1] = polar(cx, cy, r, A1);
  const [xe, ye] = polar(cx, cy, r, end);
  const danger = pct >= 80;
  const color = danger ? "var(--danger)" : "var(--brand)";

  const ticks = Array.from({ length: 25 }, (_, i) => {
    const a = A0 + ((A1 - A0) * i) / 24;
    const long = i % 4 === 0;
    const [tx1, ty1] = polar(cx, cy, r - 8, a);
    const [tx2, ty2] = polar(cx, cy, r - (long ? 15 : 12), a);
    return { key: i, tx1, ty1, tx2, ty2, long };
  });

  return (
    <div className="m-base flex flex-col p-[14px]">
      <span className="text-ink-mut font-mono text-[9px] font-bold tracking-[0.04em] uppercase">
        {label}
      </span>
      <svg
        viewBox="0 0 120 80"
        role="img"
        aria-label={`${label}: ${pct}%`}
        className="mx-auto -mt-1 w-full max-w-[168px]"
      >
        <path
          d={`M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M ${x0} ${y0} A ${r} ${r} 0 ${end - A0 > 180 ? 1 : 0} 1 ${xe} ${ye}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.tx1}
            y1={t.ty1}
            x2={t.tx2}
            y2={t.ty2}
            stroke={t.long ? "var(--ink-mut-2)" : "var(--line)"}
            strokeWidth={t.long ? 1.4 : 1}
          />
        ))}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fontSize="21"
          fontWeight="800"
          fill={danger ? "var(--danger)" : "var(--ink)"}
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </text>
      </svg>
      {hint && (
        <span className="text-ink-mut -mt-1 text-center text-[11px]">
          {hint}
        </span>
      )}
    </div>
  );
}

/** Chip de persona: inicial sobre su color (home_people). */
export function PersonDot({
  initial,
  color,
}: {
  initial: string;
  color: string;
}) {
  return (
    <span
      aria-hidden
      className="grid size-[16px] flex-none place-items-center rounded-full text-[8px] font-extrabold text-white"
      style={{ background: color }}
    >
      {initial}
    </span>
  );
}
