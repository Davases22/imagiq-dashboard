"use client";

import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Archive, Trash2 } from "lucide-react";
import type { SubmissionStatus } from "@/types/form-page";

interface SubmissionsBulkActionsProps {
  selectedCount: number;
  onBulkUpdateStatus: (status: SubmissionStatus) => void;
  onBulkDelete: () => void;
}

export function SubmissionsBulkActions({
  selectedCount, onBulkUpdateStatus, onBulkDelete,
}: SubmissionsBulkActionsProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
      <span className="text-sm font-medium">{selectedCount} seleccionados</span>
      <Button variant="outline" size="sm" onClick={() => onBulkUpdateStatus("leido")}>
        <Eye className="mr-1 h-3 w-3" /> Marcar leído
      </Button>
      <Button variant="outline" size="sm" onClick={() => onBulkUpdateStatus("procesado")}>
        <CheckCircle className="mr-1 h-3 w-3" /> Procesar
      </Button>
      <Button variant="outline" size="sm" onClick={() => onBulkUpdateStatus("archivado")}>
        <Archive className="mr-1 h-3 w-3" /> Archivar
      </Button>
      <Button variant="destructive" size="sm" onClick={onBulkDelete}>
        <Trash2 className="mr-1 h-3 w-3" /> Eliminar
      </Button>
    </div>
  );
}
