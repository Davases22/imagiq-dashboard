"use client";

import { Button } from "@/components/ui/button";
import { Plus, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useFaqs } from "@/hooks/use-faqs";
import { FaqsTable } from "@/components/faqs/faqs-table";
import { FaqFormDialog } from "@/components/faqs/faq-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FaqsPage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const { stats, isLoading: statsLoading, refetch } = useFaqs();

  const handleCreateFaq = () => {
    setEditingFaqId(null);
    setFormDialogOpen(true);
  };

  const handleEditFaq = (id: string) => {
    setEditingFaqId(id);
    setFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingFaqId(null);
    refetch();
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-muted-foreground">
            Gestiona las preguntas frecuentes de tu tienda
          </p>
        </div>
        <Button onClick={handleCreateFaq}>
          <Plus className="mr-2 h-4 w-4" />
          Crear FAQ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Preguntas frecuentes registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.activos}
            </div>
            <p className="text-xs text-muted-foreground">
              Visibles para los clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.inactivos}
            </div>
            <p className="text-xs text-muted-foreground">
              Ocultos temporalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs Table */}
      <FaqsTable onEdit={handleEditFaq} onRefetch={refetch} />

      {/* Form Dialog */}
      <FaqFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        faqId={editingFaqId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
