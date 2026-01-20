"use client";

import { CampaignStatsCard } from "@/components/campaigns/stats/campaign-stats-card";
import { CampaignsTable } from "@/components/campaigns/tables/campaigns-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Mail, Eye, MessageSquare, Smartphone, Monitor, Globe, Ban, Zap, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandIcon } from "@/components/icons/BrandIcon";
import Link from "next/link";
import { useInWebCampaigns } from "@/hooks/use-inweb-campaigns";
import { useMemo } from "react";

export default function CampañasPage() {
  const router = useRouter();
  
  // Obtener campañas In-Web para contar las activas
  const { campaigns: inWebCampaigns } = useInWebCampaigns({
    page: 1,
    limit: 100,
  });

  // Contar campañas activas de In-Web
  const activeInWebCount = useMemo(() => {
    return inWebCampaigns.filter(campaign => campaign.status === 'active').length;
  }, [inWebCampaigns]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas</h1>
          <p className="text-muted-foreground">
            Gestiona tus campañas de marketing
          </p>
        </div>
        <Button onClick={() => router.push('/marketing/campaigns/crear')}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Campaña
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CampaignStatsCard
          title="Nuevos leads"
          value="137"
          subtitle="Objetivo diario"
          progress={70}
          icon={Users}
        />
        <CampaignStatsCard
          title="Tasa de conversión"
          value="0.7%"
          subtitle="Objetivo diario"
          progress={96}
          icon={Mail}
        />
        <CampaignStatsCard
          title="Tasa de apertura"
          value="24.3%"
          subtitle="Promedio mensual"
          progress={90}
          icon={Eye}
        />
        <CampaignStatsCard
          title="CTR Promedio"
          value="3.2%"
          subtitle="Click-through rate"
          progress={85}
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Campaigns Table */}
        <div className="col-span-5">
          <CampaignsTable />
        </div>

        {/* Channels Card */}
        <Card className="col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Canales de Marketing</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <BrandIcon brand="WhatsApp" size={24} className="text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-sm">WhatsApp</div>
                    <div className="text-xs text-muted-foreground">2 campañas activas</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href="/marketing/campaigns/templates/whatsapp">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Plantillas
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    Crear
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <BrandIcon brand="Gmail" size={24} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-sm">Email</div>
                    <div className="text-xs text-muted-foreground">3 campañas activas</div>
                  </div>
                </div>
                <Link href="/marketing/campaigns/crear/email">
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    Crear
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="font-medium text-sm">SMS</div>
                    <div className="text-xs text-muted-foreground">1 campaña activa</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  Crear
                </Button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="font-medium text-sm">In-Web</div>
                    <div className="text-xs text-muted-foreground">
                      {activeInWebCount === 1 
                        ? "1 campaña activa" 
                        : `${activeInWebCount} campañas activas`}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => router.push('/marketing/campaigns/crear/inweb')}
                >
                  Crear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}