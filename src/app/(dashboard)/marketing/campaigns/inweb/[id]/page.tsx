"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Edit, Loader2, Monitor, Globe, Calendar, Users, Target, Image as ImageIcon, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInWebCampaign } from "@/hooks/use-inweb-campaign";
import { InWebCampaignResponse } from "@/lib/api";
import { InWebPreview } from "@/components/campaigns/inweb/inweb-preview";

// Mapeo de tipos de campaña
const getCampaignTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    promocional: "Promocional",
    transactional: "Transaccional",
    transaccional: "Transaccional",
    news: "Noticias",
    noticias: "Noticias",
    reminder: "Recordatorio",
    recordatorio: "Recordatorio",
    "abandoned-cart": "Carrito Abandonado",
    "carrito-abandonado": "Carrito Abandonado",
  };
  return typeMap[type] || type;
};

// Mapeo de estados
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: "Borrador",
    active: "Activa",
    paused: "Pausada",
    completed: "Completada",
  };
  return statusMap[status] || status;
};

// Mapeo de estilos de visualización
const getDisplayStyleLabel = (style: string): string => {
  const styleMap: Record<string, string> = {
    modal: "Popup",
    popup: "Popup",
    slider: "Slider",
    banner: "Banner",
  };
  return styleMap[style] || style;
};

// Mapeo de urgencia
const getUrgencyLabel = (urgency: string): string => {
  const urgencyMap: Record<string, string> = {
    "Muy Baja": "Muy Baja",
    "Baja": "Baja",
    "Normal": "Normal",
    "Alta": "Alta",
    "very-low": "Muy Baja",
    "low": "Baja",
    "normal": "Normal",
    "high": "Alta",
  };
  return urgencyMap[urgency] || urgency;
};

// Mapeo de operadores de compra
const getPurchaseOperatorLabel = (operator: string): string => {
  const operatorMap: Record<string, string> = {
    greater_than: "Mayor que",
    greater_than_or_equal: "Mayor o igual que",
    equal: "Igual a",
    less_than_or_equal: "Menor o igual que",
    less_than: "Menor que",
  };
  return operatorMap[operator] || operator;
};

export default function InWebCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const { campaign, isLoading, error } = useInWebCampaign(campaignId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Cargando campaña...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/marketing/campaigns")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error?.message || "No se pudo cargar la campaña"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/marketing/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.campaign_name}</h1>
            <p className="text-muted-foreground">Detalles de la campaña In-Web</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/marketing/campaigns/inweb/${campaignId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de la Campaña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Información de la Campaña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{campaign.campaign_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{getCampaignTypeLabel(campaign.campaign_type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge
                variant={
                  campaign.status === "active"
                    ? "default"
                    : campaign.status === "completed"
                    ? "secondary"
                    : campaign.status === "paused"
                    ? "outline"
                    : "destructive"
                }
              >
                {getStatusLabel(campaign.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-medium">{campaign.created_by_email || campaign.created_by}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de creación</p>
              <p className="font-medium">
                {new Date(campaign.created_at).toLocaleString("es-ES")}
              </p>
            </div>
            {campaign.updated_at && (
              <div>
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="font-medium">
                  {new Date(campaign.updated_at).toLocaleString("es-ES")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Segmentación de Audiencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Segmentación de Audiencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Audiencia</p>
              <p className="font-medium">
                {campaign.audience === "all" ? "Todos" : campaign.audience}
              </p>
            </div>
            {campaign.cities && campaign.cities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Ciudades</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {campaign.cities.map((city, index) => (
                    <Badge key={index} variant="outline">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Rango de edad</p>
              <p className="font-medium">
                {campaign.age_min} - {campaign.age_max} años
              </p>
            </div>
            {campaign.purchase_filter_operator && campaign.purchase_filter_count !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Filtro de compras</p>
                <p className="font-medium">
                  {getPurchaseOperatorLabel(campaign.purchase_filter_operator)}{" "}
                  {campaign.purchase_filter_count} compras
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contenido */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Contenido y Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de contenido</p>
              <p className="font-medium">
                {campaign.content_type === "image" ? "Imagen" : "HTML"}
              </p>
            </div>
            
            {/* Vista Previa con tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Vista Previa</p>
                <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as "desktop" | "mobile")}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="desktop" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Móvil
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <InWebPreview
                  image={campaign.image_url || ""}
                  previewUrl={campaign.preview_url || ""}
                  displayStyle={campaign.display_style === "modal" ? "popup" : campaign.display_style === "slider" ? "slider" : "popup"}
                  contentType={campaign.content_type as "image" | "html"}
                  htmlContent={campaign.html_content || ""}
                  mode={previewMode}
                />
              </div>
            </div>

            {/* URLs como texto plano */}
            {campaign.content_url && (
              <div>
                <p className="text-sm text-muted-foreground">URL de destino</p>
                <p className="font-medium break-all text-sm mt-1 p-2 bg-muted/50 rounded border">
                  {campaign.content_url}
                </p>
              </div>
            )}
            {campaign.preview_url && (
              <div>
                <p className="text-sm text-muted-foreground">URL de vista previa</p>
                <p className="font-medium break-all text-sm mt-1 p-2 bg-muted/50 rounded border">
                  {campaign.preview_url}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración de Comportamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Comportamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Estilo de visualización</p>
              <p className="font-medium">{getDisplayStyleLabel(campaign.display_style)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Urgencia</p>
              <p className="font-medium">{getUrgencyLabel(campaign.urgency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TTL (segundos)</p>
              <p className="font-medium">{campaign.ttl}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fallback habilitado</p>
              <Badge variant={campaign.enable_fallback ? "default" : "outline"}>
                {campaign.enable_fallback ? "Sí" : "No"}
              </Badge>
            </div>
            {campaign.enable_frequency_cap && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Límite de frecuencia</p>
                  <Badge variant="default">Habilitado</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Máximo por día</p>
                  <p className="font-medium">{campaign.max_per_day}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Máximo por semana</p>
                  <p className="font-medium">{campaign.max_per_week}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Programación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Envío inmediato</p>
              <Badge variant={campaign.send_immediately ? "default" : "outline"}>
                {campaign.send_immediately ? "Sí" : "No"}
              </Badge>
            </div>
            {campaign.initial_date && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                <p className="font-medium">
                  {new Date(campaign.initial_date).toLocaleString("es-ES")}
                </p>
              </div>
            )}
            {campaign.final_date && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de finalización</p>
                <p className="font-medium">
                  {new Date(campaign.final_date).toLocaleString("es-ES")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* A/B Testing */}
        {campaign.enable_ab_test && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                A/B Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">A/B Testing</p>
                <Badge variant="default">Habilitado</Badge>
              </div>
              {campaign.ab_test_percentage !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Porcentaje</p>
                  <p className="font-medium">{campaign.ab_test_percentage}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

