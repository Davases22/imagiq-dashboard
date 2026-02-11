"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormSubmissions } from "@/hooks/use-form-submissions";
import { SubmissionsStats } from "./submissions-stats";
import { SubmissionsFilters } from "./submissions-filters";
import { SubmissionsTable } from "./submissions-table";
import { SubmissionsBulkActions } from "./submissions-bulk-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionsViewerProps {
  pageId: string;
}

export function SubmissionsViewer({ pageId }: SubmissionsViewerProps) {
  const hook = useFormSubmissions({ pageId });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <SubmissionsStats stats={hook.stats} isLoading={hook.isLoading && !hook.stats} />

      {/* Filters */}
      <SubmissionsFilters
        statusFilter={hook.statusFilter}
        searchTerm={hook.searchTerm}
        dateFrom={hook.dateFrom}
        dateTo={hook.dateTo}
        onStatusFilterChange={hook.setStatusFilter}
        onSearchTermChange={hook.setSearchTerm}
        onDateFromChange={hook.setDateFrom}
        onDateToChange={hook.setDateTo}
        onExport={hook.exportData}
      />

      {/* Bulk Actions (visible when items selected) */}
      {hook.selectedIds.size > 0 && (
        <SubmissionsBulkActions
          selectedCount={hook.selectedIds.size}
          onBulkUpdateStatus={hook.bulkUpdateStatus}
          onBulkDelete={hook.bulkDelete}
        />
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Respuestas {hook.total > 0 && `(${hook.total})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hook.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : hook.submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No hay respuestas aún</p>
              <p className="text-sm">Las respuestas aparecerán aquí cuando los usuarios envíen el formulario</p>
            </div>
          ) : (
            <SubmissionsTable
              submissions={hook.submissions}
              formFields={hook.formFields}
              selectedIds={hook.selectedIds}
              onToggleSelect={hook.toggleSelect}
              onToggleSelectAll={hook.toggleSelectAll}
              onUpdateStatus={hook.updateStatus}
              onDelete={hook.deleteSubmission}
              currentPage={hook.currentPage}
              totalPages={hook.totalPages}
              pageSize={hook.pageSize}
              total={hook.total}
              onPageChange={hook.setCurrentPage}
              onPageSizeChange={hook.setPageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
