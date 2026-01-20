"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { stripoEndpoints, EmailTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Mail,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await stripoEndpoints.listTemplates();
      if (response.success && response.data) {
        // Handle both array and object response formats
        const templateList = Array.isArray(response.data)
          ? response.data
          : [];
        setTemplates(templateList);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Error al cargar los templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push("/marketing/campaigns/crear/email");
  };

  const handleEdit = (templateId: string) => {
    router.push(`/marketing/campaigns/templates/email/${templateId}/edit`);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const response = await stripoEndpoints.saveTemplate({
        name: `${template.name} (Copia)`,
        subject: template.subject,
        description: template.description,
        htmlContent: template.htmlContent,
        designJson: template.designJson as Record<string, unknown>,
        category: template.category,
        status: "draft",
      });

      if (response.success) {
        toast.success("Template duplicado correctamente");
        loadTemplates();
      } else {
        toast.error("Error al duplicar el template");
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Error al duplicar el template");
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;

    setIsDeleting(true);
    try {
      const response = await stripoEndpoints.deleteTemplate(deleteTemplateId);
      if (response.success) {
        toast.success("Template eliminado correctamente");
        setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateId));
      } else {
        toast.error("Error al eliminar el template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Error al eliminar el template");
    } finally {
      setIsDeleting(false);
      setDeleteTemplateId(null);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Borrador", className: "bg-yellow-100 text-yellow-800" },
      active: { label: "Activo", className: "bg-green-100 text-green-800" },
      archived: { label: "Archivado", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status || "draft"] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Templates de Email</h1>
          <p className="text-muted-foreground">
            Gestiona tus plantillas de email para campañas
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && templates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay templates</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Crea tu primer template de email para comenzar a diseñar campañas
              de marketing efectivas.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {!isLoading && templates.length > 0 && filteredTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sin resultados</h3>
            <p className="text-muted-foreground text-center">
              No se encontraron templates que coincidan con "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates grid */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEdit(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {template.subject}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template.id);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTemplateId(template.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {/* Preview placeholder */}
                <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex items-center justify-between">
                {getStatusBadge(template.status)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(template.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={() => setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Template</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este template? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
