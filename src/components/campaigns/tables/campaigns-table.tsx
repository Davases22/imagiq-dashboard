"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Campaign } from "@/types";
import { useInWebCampaigns } from "@/hooks/use-inweb-campaigns";
import { MoreHorizontal, Mail, MessageSquare, Smartphone, Monitor, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'sms':
      return <Smartphone className="h-4 w-4" />;
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4" />;
    case 'in-web':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    case 'in-web':
      return 'Inweb';
    default:
      return type;
  }
};

// Función para crear las columnas con handlers de acciones
const createCampaignColumns = (
  onDelete: (campaign: Campaign) => void,
  onPause: (campaign: Campaign) => void
): ColumnDef<Campaign>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const campaign = row.original;
      return (
        <div className="flex items-center gap-2">
          {getTypeIcon(campaign.type)}
          <span className="font-medium">{campaign.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline">
          {getTypeLabel(type)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "completed"
              ? "secondary"
              : status === "paused"
              ? "outline"
              : "destructive"
          }
        >
          {status === "active" ? "Activa" :
           status === "completed" ? "Completada" :
           status === "paused" ? "Pausada" : "Borrador"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "reach",
    header: "Alcance",
    cell: ({ row }) => {
      const reach = row.getValue("reach") as number;
      return reach > 0 ? reach.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "clicks",
    header: "Clicks",
    cell: ({ row }) => {
      const clicks = row.getValue("clicks") as number;
      return clicks > 0 ? clicks.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "conversions",
    header: "Conversiones",
    cell: ({ row }) => {
      const conversions = row.getValue("conversions") as number;
      return conversions > 0 ? conversions.toLocaleString() : "-";
    },
  },
  {
    id: "ctr",
    header: "CTR",
    cell: ({ row }) => {
      const campaign = row.original;
      const ctr = campaign.reach > 0 ? (campaign.clicks / campaign.reach * 100) : 0;
      return ctr > 0 ? `${ctr.toFixed(1)}%` : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Creado",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const campaign = row.original;
      const isInWebCampaign = campaign.type === 'in-web';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar campaña</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            {isInWebCampaign && campaign.status === 'active' && (
              <DropdownMenuItem onClick={() => onPause(campaign)}>
                Pausar
              </DropdownMenuItem>
            )}
            {isInWebCampaign && (
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete(campaign)}
              >
                Eliminar
              </DropdownMenuItem>
            )}
            {!isInWebCampaign && (
              <>
                <DropdownMenuItem>
                  {campaign.status === 'active' ? 'Pausar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const campaignTypes = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Inweb", value: "in-web" },
];

const campaignStatuses = [
  { label: "Activa", value: "active" },
  { label: "Completada", value: "completed" },
  { label: "Pausada", value: "paused" },
  { label: "Borrador", value: "draft" },
];

export function CampaignsTable() {
  // Estado para diálogos de confirmación
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToPause, setCampaignToPause] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // Obtener campañas InWeb desde la API
  const { campaigns, isLoading, refetch, deleteCampaign, pauseCampaign } = useInWebCampaigns({
    page: 1,
    limit: 100, // Obtener todas las campañas por ahora
  });

  // Handlers para acciones
  const handleDeleteClick = (campaign: Campaign) => {
    if (campaign.type === 'in-web') {
      setCampaignToDelete(campaign);
    } else {
      toast.info('La eliminación de campañas no InWeb aún no está implementada');
    }
  };

  const handlePauseClick = (campaign: Campaign) => {
    if (campaign.type === 'in-web' && campaign.status === 'active') {
      setCampaignToPause(campaign);
    } else {
      toast.info('Solo se pueden pausar campañas InWeb activas');
    }
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCampaign(campaignToDelete.id);
      setCampaignToDelete(null);
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmPause = async () => {
    if (!campaignToPause) return;

    setIsPausing(true);
    try {
      await pauseCampaign(campaignToPause.id);
      setCampaignToPause(null);
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setIsPausing(false);
    }
  };

  // Crear columnas con handlers
  const columns = useMemo(
    () => createCampaignColumns(handleDeleteClick, handlePauseClick),
    []
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Campañas</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando campañas...</span>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={campaigns}
              searchKey="name"
              filters={[
                {
                  id: "type",
                  title: "Tipo",
                  options: campaignTypes,
                },
                {
                  id: "status",
                  title: "Estado",
                  options: campaignStatuses,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la campaña{" "}
              <span className="font-semibold">{campaignToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación de pausar */}
      <AlertDialog open={!!campaignToPause} onOpenChange={(open) => !open && setCampaignToPause(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              La campaña <span className="font-semibold">{campaignToPause?.name}</span> será pausada.
              Podrás reactivarla más tarde desde el menú de acciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPausing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPause}
              disabled={isPausing}
            >
              {isPausing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausando...
                </>
              ) : (
                "Pausar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}