"use client";

import { BannerStatsCard } from "@/components/banners/stats/banner-stats-card";
import { BannersTable } from "@/components/banners/tables/banners-table";
import { Button } from "@/components/ui/button";
import { Plus, Eye, MousePointer, TrendingUp, Image, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrganizeBannersModal } from "@/components/banners/organize-banners-modal";
import { useBannerStats } from "@/hooks/use-banner-stats";

export default function BannersPage() {
  const router = useRouter();
  const [organizeModalOpen, setOrganizeModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Obtener estadísticas reales de banners
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useBannerStats();

  const handleCreateBanner = () => {
    router.push('/marketing/banners/crear/seleccionar-tipo');
  };

  const handleOrganizeSuccess = () => {
    // Trigger refresh en la tabla y stats
    setRefreshTrigger(prev => prev + 1);
    refetchStats();
  };

  return (
    // `min-w-0` permite que este contenedor principal pueda encogerse cuando un
    // hijo (la tabla) es más ancho; de este modo el scroll horizontal quedará
    // confinado al wrapper de la tabla.
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners Hero</h1>
          <p className="text-muted-foreground">
            Gestiona los banners del hero section de tu tienda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOrganizeModalOpen(true)}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Organizar Banners
          </Button>
          <Button onClick={handleCreateBanner}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Banner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BannerStatsCard
          title="Total Impresiones"
          value="105,780"
          subtitle="Último mes"
          progress={82}
          icon={Eye}
          trend={{ value: "15.3%", isPositive: true }}
        />
        <BannerStatsCard
          title="Total Clicks"
          value="3,540"
          subtitle="Último mes"
          progress={89}
          icon={MousePointer}
          trend={{ value: "9.7%", isPositive: true }}
        />
        <BannerStatsCard
          title="CTR Promedio"
          value="3.35%"
          subtitle="Click-through rate"
          progress={85}
          icon={TrendingUp}
          trend={{ value: "0.2%", isPositive: true }}
        />
        <BannerStatsCard
          title="Banners Activos"
          value={statsLoading ? "..." : String(stats?.activos || 0)}
          subtitle={statsLoading ? "Cargando..." : `De ${stats?.total || 0} totales`}
          progress={stats ? Math.round((stats.activos / stats.total) * 100) : 0}
          icon={Image}
        />
      </div>

      {/* Banners Table */}
      <BannersTable key={refreshTrigger} />

      {/* Modal de organización */}
      <OrganizeBannersModal
        open={organizeModalOpen}
        onOpenChange={setOrganizeModalOpen}
        onSuccess={handleOrganizeSuccess}
      />
    </div>
  );
}