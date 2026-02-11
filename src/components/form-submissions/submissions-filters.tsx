"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, X } from "lucide-react";
import type { SubmissionStatus } from "@/types/form-page";
import { SUBMISSION_STATUS_LABELS } from "@/types/form-page";

interface SubmissionsFiltersProps {
  statusFilter: SubmissionStatus | "";
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  onStatusFilterChange: (status: SubmissionStatus | "") => void;
  onSearchTermChange: (term: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onExport: (format: "csv" | "json") => void;
}

const STATUS_OPTIONS: (SubmissionStatus | "")[] = ["", "nuevo", "leido", "procesado", "archivado"];

export function SubmissionsFilters({
  statusFilter, searchTerm, dateFrom, dateTo,
  onStatusFilterChange, onSearchTermChange, onDateFromChange, onDateToChange, onExport,
}: SubmissionsFiltersProps) {
  const hasFilters = statusFilter || searchTerm || dateFrom || dateTo;

  const clearFilters = () => {
    onStatusFilterChange("");
    onSearchTermChange("");
    onDateFromChange("");
    onDateToChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status pills */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((status) => (
            <Badge
              key={status || "all"}
              variant={statusFilter === status ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onStatusFilterChange(status)}
            >
              {status ? SUBMISSION_STATUS_LABELS[status] : "Todos"}
            </Badge>
          ))}
        </div>

        {/* Export buttons */}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
            <Download className="mr-1 h-3 w-3" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("json")}>
            <Download className="mr-1 h-3 w-3" /> JSON
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar en respuestas..."
            className="pl-8"
          />
        </div>

        {/* Date range */}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-40"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-40"
          placeholder="Hasta"
        />

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" /> Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
