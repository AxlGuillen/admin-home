import { Skeleton } from "@/components/ui/skeleton";
import { CardListSkeleton } from "@/modules/finance";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <CardListSkeleton />
    </div>
  );
}
