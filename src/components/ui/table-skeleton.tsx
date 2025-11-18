"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showSearch?: boolean;
  showActions?: boolean;
}

export function TableSkeleton({
  columns = 6,
  rows = 5,
  showSearch = true,
  showActions = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      {(showSearch || showActions) && (
        <div className="flex items-center justify-between">
          {showSearch && <Skeleton className="h-10 w-[300px]" />}
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-9 w-[100px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-4 pb-2 border-b">
            {[...Array(columns)].map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 w-[100px]" />
            ))}
          </div>

          {/* Rows */}
          {[...Array(rows)].map((_, i) => (
            <div key={`row-${i}`} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              {[...Array(columns - 1)].map((_, j) => (
                <Skeleton
                  key={`cell-${i}-${j}`}
                  className={`h-4 ${j === 0 ? 'w-[150px]' : j === 1 ? 'w-[80px]' : 'w-[100px]'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    </div>
  );
}
