import { Skeleton } from "@/components/ui/skeleton";
import { PersonListSkeleton } from "@/modules/people";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <PersonListSkeleton />
    </div>
  );
}
