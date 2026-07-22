import { cn } from "@/lib/utils";

type Tone = "default" | "danger" | "pos";

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  danger: "text-destructive",
  pos: "text-[var(--c-pos)]",
};

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="blueprint bg-card elev-sm relative px-[18px] py-4">
      <div className="text-muted-foreground text-[10px] tracking-[0.1em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-2.5 font-[family-name:var(--font-barlow-condensed)] text-[26px] leading-none",
          toneClass[tone],
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="text-muted-foreground mt-1.5 text-[11px]">{hint}</div>
      )}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("blueprint bg-card elev-sm relative p-[22px]", className)}>
      {title && <h4 className="mb-1 text-base">{title}</h4>}
      {subtitle && (
        <p className="text-muted-foreground mb-3.5 text-xs">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

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
    <div className="mb-7 flex flex-wrap items-end gap-4">
      <div className="min-w-[220px] flex-1">
        {kicker && (
          <div className="text-primary mb-2 font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-[0.22em]">
            {kicker}
          </div>
        )}
        <h1 className="mb-1 text-[40px] leading-none">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
