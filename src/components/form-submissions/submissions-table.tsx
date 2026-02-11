"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { FormSubmission, FormFieldDefinition, SubmissionStatus } from "@/types/form-page";
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS } from "@/types/form-page";

interface SubmissionsTableProps {
  submissions: FormSubmission[];
  formFields: FormFieldDefinition[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onUpdateStatus: (id: string, status: SubmissionStatus) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function SubmissionsTable({
  submissions, formFields, selectedIds,
  onToggleSelect, onToggleSelectAll, onUpdateStatus, onDelete,
  currentPage, totalPages, pageSize, total, onPageChange, onPageSizeChange,
}: SubmissionsTableProps) {
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  // Show first 3 form fields as columns + status + date + actions
  const visibleFields = formFields.slice(0, 3);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateStr; }
  };

  const getFieldValue = (submission: FormSubmission, fieldId: string): string => {
    const val = submission.data[fieldId];
    if (val === undefined || val === null) return "-";
    if (typeof val === "boolean") return val ? "Sí" : "No";
    return String(val);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedIds.size === submissions.length && submissions.length > 0}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            {visibleFields.map((field) => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(submission.id)}
                  onCheckedChange={() => onToggleSelect(submission.id)}
                />
              </TableCell>
              {visibleFields.map((field) => (
                <TableCell key={field.id} className="max-w-[200px] truncate">
                  {getFieldValue(submission, field.id)}
                </TableCell>
              ))}
              <TableCell>
                <Badge className={SUBMISSION_STATUS_COLORS[submission.status]}>
                  {SUBMISSION_STATUS_LABELS[submission.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(submission.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetailSubmission(submission)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(submission.id, "leido")}>
                      Marcar como leído
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(submission.id, "procesado")}>
                      Marcar como procesado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(submission.id, "archivado")}>
                      Archivar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(submission.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrando {submissions.length} de {total}</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>por página</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">{currentPage} / {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailSubmission} onOpenChange={() => setDetailSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Respuesta</DialogTitle>
          </DialogHeader>
          {detailSubmission && (
            <div className="space-y-3">
              {formFields.map((field) => (
                <div key={field.id} className="border-b pb-2">
                  <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                  <p className="text-sm">{getFieldValue(detailSubmission, field.id)}</p>
                </div>
              ))}
              <div className="border-b pb-2">
                <p className="text-xs font-medium text-muted-foreground">Estado</p>
                <Badge className={SUBMISSION_STATUS_COLORS[detailSubmission.status]}>
                  {SUBMISSION_STATUS_LABELS[detailSubmission.status]}
                </Badge>
              </div>
              <div className="border-b pb-2">
                <p className="text-xs font-medium text-muted-foreground">Fecha</p>
                <p className="text-sm">{formatDate(detailSubmission.created_at)}</p>
              </div>
              {detailSubmission.ip_address && (
                <div className="border-b pb-2">
                  <p className="text-xs font-medium text-muted-foreground">IP</p>
                  <p className="text-sm">{detailSubmission.ip_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
