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
  // Relleno invertido por token: `--ink` como fondo se vuelve casi blanco en
  // tema oscuro y le ganaría en energía visual a la card dominante.
  dark: "bg-[var(--fill-strong)] text-[var(--fill-strong-fg)]",
  onBrand: "bg-white/20 text-white",
};

/** Chip de estado (DESIGN §6: padding 5px 9px, 700/9px). */
export function Chip({
  children,
  tone = "neutral",
  numeric = false,
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  /** Envuelve cifras: mono + tabular para que escaneen en columna. */
  numeric?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[9px] py-[5px] text-[9px] leading-none font-bold whitespace-nowrap",
        numeric && "tnum",
        chipTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Chip de delta (DESIGN §6: padding 3px 7px, 800/10px + flecha). */
export function Delta({
  value,
  direction,
  tone = "neutral",
  className,
}: {
  value: string;
  direction: "up" | "down";
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[7px] py-[3px] text-[10px] leading-none font-extrabold whitespace-nowrap",
        chipTone[tone],
        className,
      )}
    >
      {direction === "up" ? "\u2197" : "\u2198"}
      <span className="tnum">{value}</span>
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

/** Tipo 1 · KPI en card base neutra (anatomía de DESIGN §6). */
export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  family = "credito",
  delta,
  tone = "default",
  ticks = false,
  step,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Tinte del chip de icono: identifica la familia del dato. */
  family?: "credito" | "debito" | "suscrip";
  delta?: React.ReactNode;
  tone?: Tone;
  ticks?: boolean;
  /** Escalón tonal (tipo 5): 1 → 8%, 2 → 14%, 3 → 20%. */
  step?: 1 | 2 | 3;
}) {
  const tint = `var(--d-${family})`;
  return (
    <div
      className={cn("m-base flex flex-col p-[14px]", step && `m-step-${step}`)}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className="grid size-7 flex-none place-items-center rounded-[var(--r-el-sm)]"
            style={{
              background: `color-mix(in srgb, ${tint} 16%, transparent)`,
              color: tint,
            }}
          >
            <Icon className="size-[15px]" strokeWidth={2} />
          </span>
        )}
        <span className="text-ink-mut text-[11px] font-bold tracking-[0.04em] uppercase">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "tnum mt-2.5 text-[31px] leading-none font-extrabold tracking-[-0.03em]",
          toneText[tone],
        )}
      >
        {value}
      </span>
      {ticks && <span className="ticks text-line mt-2 block" />}
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2">
          {delta}
          {hint && (
            <span className="text-ink-mut text-[11px] leading-tight">
              {hint}
            </span>
          )}
        </div>
      )}
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
        <span className="ticks mt-2.5 block text-white/30" />
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
              ? "text-danger-on-dark [text-shadow:0_0_16px_var(--danger-glow)]"
              : "text-[var(--brand-100)] [text-shadow:0_0_16px_var(--brand-glow)]",
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
