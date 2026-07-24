import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-40" />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Skeleton className="h-[228px] rounded-[var(--r-card)]" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[106px] rounded-[var(--r-card)]" />
          ))}
        </div>
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[248px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[248px] rounded-[var(--r-card)]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-[248px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[248px] rounded-[var(--r-card-sm)]" />
      </div>
    </div>
  );
}
