"use client";

import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { inWebCampaignEndpoints, InWebCampaign } from "@/lib/api";
import { MoreHorizontal, Monitor, Eye, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const getStatusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "paused":
      return "outline";
    case "draft":
      return "secondary";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Activa";
    case "paused":
      return "Pausada";
    case "draft":
      return "Borrador";
    default:
      return status;
  }
};

const getCampaignTypeLabel = (type: string) => {
  switch (type) {
    case "promotional":
      return "Promocional";
    case "transactional":
      return "Transaccional";
    case "informational":
      return "Informacional";
    default:
      return type;
  }
};

export function InWebCampaignsTable() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<InWebCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const fetchCampaigns = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const response = await inWebCampaignEndpoints.getAll({ page, limit });

      if (response.success && response.data) {
        setCampaigns(response.data.data);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta campaña?")) return;

    try {
      const response = await inWebCampaignEndpoints.delete(id);
      if (response.success) {
        fetchCampaigns(pagination.page, pagination.limit);
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const columns: ColumnDef<InWebCampaign>[] = [
    {
      accessorKey: "campaign_name",
      header: "Nombre",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{campaign.campaign_name || "Sin nombre"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "campaign_type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.campaign_type;
        return (
          <Badge variant="outline">
            {getCampaignTypeLabel(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "content_type",
      header: "Contenido",
      cell: ({ row }) => {
        const contentType = row.original.content_type;
        return (
          <Badge variant="secondary">
            {contentType === "image" ? "Imagen" : "HTML"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "display_style",
      header: "Estilo",
      cell: ({ row }) => {
        const style = row.original.display_style;
        return (
          <span className="text-sm">
            {style === "popup" ? "Popup" : "Slider"}
          </span>
        );
      },
    },
    {
      accessorKey: "audience",
      header: "Audiencia",
      cell: ({ row }) => {
        const audience = row.original.audience;
        return (
          <span className="text-sm">
            {audience === "all" ? "Todos" : audience === "new_users" ? "Nuevos" : "Recurrentes"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status || "draft";
        return (
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Creado",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const campaign = row.original;

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
              <DropdownMenuItem onClick={() => router.push(`/marketing/campaigns/inweb/${campaign.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/marketing/campaigns/inweb/${campaign.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDelete(campaign.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Campañas InWeb</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Cargando campañas...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={campaigns}
            searchKey="campaign_name"
            pageCount={Math.ceil(pagination.total / pagination.limit)}
            pageIndex={pagination.page - 1}
            pageSize={pagination.limit}
            totalItems={pagination.total}
            onPaginationChange={(newPagination) => {
              fetchCampaigns(newPagination.pageIndex + 1, newPagination.pageSize);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
