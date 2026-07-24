import { Skeleton } from "@/components/ui/skeleton";
import { CardListSkeleton } from "@/modules/finance";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-[var(--r-el)]" />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[190px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[190px] rounded-[var(--r-card-sm)]" />
      </div>
      <CardListSkeleton />
    </div>
  );
}
