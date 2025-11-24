"use client";

import { InWebCampaignsTable } from "@/components/campaigns/tables/inweb-campaigns-table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InWebCampaignsPage() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/marketing/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campañas InWeb</h1>
            <p className="text-muted-foreground">
              Gestiona tus campañas de notificaciones web
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/marketing/campaigns/crear/inweb')}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Campaña InWeb
        </Button>
      </div>

      <InWebCampaignsTable />
    </div>
  );
}
