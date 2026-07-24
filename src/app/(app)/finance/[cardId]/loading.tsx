import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-3.5 h-4 w-20" />
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Skeleton className="h-[228px] rounded-[var(--r-card)]" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[106px] rounded-[var(--r-card)]" />
          ))}
        </div>
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-[260px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[260px] rounded-[var(--r-card)]" />
      </div>
      <Skeleton className="h-[220px] rounded-[var(--r-card)]" />
    </div>
  );
}
