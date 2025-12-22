"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Monitor,
  Globe,
  Loader2,
} from "lucide-react";
import { InWebPreview } from "@/components/campaigns/inweb/inweb-preview";
import {
  AudienceSegmentation,
  AudienceSegmentationData,
} from "@/components/campaigns/audience-segmentation";
import {
  CampaignInfo,
  CampaignInfoData,
} from "@/components/campaigns/inweb/campaign-info";
import {
  BehaviorSettings,
  BehaviorSettingsData,
} from "@/components/campaigns/inweb/behavior-settings";
import {
  NotificationContent,
  NotificationContentData,
} from "@/components/campaigns/inweb/notification-content";
import {
  SchedulingSettings,
  SchedulingSettingsData,
} from "@/components/campaigns/inweb/scheduling-settings";
import { campaignEndpoints } from "@/lib/api";
import { toast } from "sonner";
import { useInWebCampaign } from "@/hooks/use-inweb-campaign";

export default function EditarCampaignInWebPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { campaign, isLoading: isLoadingCampaign, error } = useInWebCampaign(campaignId);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [inWebData, setInWebData] = useState<{
    campaignName: string;
    campaignType: string;
    targetAudience: string;
    image: string; // Base64 preview o URL
    imageFile: File | null; // File object for upload
    url: string;
    previewUrl: string;
    displayStyle: "popup" | "slider";
    selectedCities: string[];
    purchaseOperator: string;
    purchaseCount: number;
    minAge: number;
    maxAge: number;
    sendImmediately: boolean;
    scheduledDate: Date | null;
    finalDate: Date | null;
    enableFrequencyCap: boolean;
    maxPerDay: number;
    maxPerWeek: number;
    enableABTest: boolean;
    abTestPercentage: number;
    ttl: number;
    urgency: string;
    enableFallback: boolean;
    contentType: "image" | "html";
    htmlContent: string;
  }>({
    campaignName: "",
    campaignType: "promotional",
    targetAudience: "all",
    image: "",
    imageFile: null,
    url: "",
    previewUrl: "",
    displayStyle: "popup",
    selectedCities: [],
    purchaseOperator: "equal",
    purchaseCount: 0,
    minAge: 18,
    maxAge: 65,
    sendImmediately: true,
    scheduledDate: null,
    finalDate: null,
    enableFrequencyCap: false,
    maxPerDay: 3,
    maxPerWeek: 10,
    enableABTest: false,
    abTestPercentage: 50,
    ttl: 3600,
    urgency: "normal",
    enableFallback: true,
    contentType: "image",
    htmlContent: "",
  });

  // Cargar datos de la campaña cuando esté disponible
  useEffect(() => {
    if (campaign && !isInitialized) {
      // Mapeo inverso: Backend → Frontend
      const mapCampaignTypeFromBackend = (type: string): string => {
        const typeMap: Record<string, string> = {
          promocional: "promotional",
          transaccional: "transactional",
          transactional: "transactional",
          noticias: "news",
          news: "news",
          recordatorio: "reminder",
          reminder: "reminder",
          "carrito-abandonado": "abandoned-cart",
          "abandoned-cart": "abandoned-cart",
        };
        return typeMap[type] || type;
      };

      const mapPurchaseOperatorFromBackend = (operator: string): string => {
        const operatorMap: Record<string, string> = {
          greater_than: "greater",
          greater_than_or_equal: "greaterEqual",
          equal: "equal",
          less_than_or_equal: "lessEqual",
          less_than: "less",
        };
        return operatorMap[operator] || "equal";
      };

      const mapDisplayStyleFromBackend = (style: string): "popup" | "slider" => {
        const styleMap: Record<string, "popup" | "slider"> = {
          modal: "popup",
          popup: "popup",
          slider: "slider",
          banner: "popup", // Default to popup for banner
        };
        return styleMap[style] || "popup";
      };

      const mapUrgencyFromBackend = (urgency: string): string => {
        const urgencyMap: Record<string, string> = {
          "Muy Baja": "very-low",
          "Baja": "low",
          "Normal": "normal",
          "Alta": "high",
          "very-low": "very-low",
          "low": "low",
          "normal": "normal",
          "high": "high",
        };
        return urgencyMap[urgency] || "normal";
      };

      setInWebData({
        campaignName: campaign.campaign_name || "",
        campaignType: mapCampaignTypeFromBackend(campaign.campaign_type),
        targetAudience: campaign.audience || "all",
        image: campaign.image_url || "",
        imageFile: null,
        url: campaign.content_url || "",
        previewUrl: campaign.preview_url || "",
        displayStyle: mapDisplayStyleFromBackend(campaign.display_style),
        selectedCities: campaign.cities || [],
        purchaseOperator: mapPurchaseOperatorFromBackend(campaign.purchase_filter_operator || "equal"),
        purchaseCount: campaign.purchase_filter_count || 0,
        minAge: campaign.age_min || 18,
        maxAge: campaign.age_max || 65,
        sendImmediately: campaign.send_immediately ?? true,
        scheduledDate: campaign.initial_date ? new Date(campaign.initial_date) : null,
        finalDate: campaign.final_date ? new Date(campaign.final_date) : null,
        enableFrequencyCap: campaign.enable_frequency_cap || false,
        maxPerDay: campaign.max_per_day || 3,
        maxPerWeek: campaign.max_per_week || 10,
        enableABTest: campaign.enable_ab_test || false,
        abTestPercentage: campaign.ab_test_percentage || 50,
        ttl: campaign.ttl || 3600,
        urgency: mapUrgencyFromBackend(campaign.urgency),
        enableFallback: campaign.enable_fallback ?? true,
        contentType: (campaign.content_type as "image" | "html") || "image",
        htmlContent: campaign.html_content || "",
      });
      setIsInitialized(true);
    }
  }, [campaign, isInitialized]);

  const handleGoBack = () => {
    router.push("/marketing/campaigns");
  };

  // Map campaign type from English to Spanish
  const mapCampaignType = (type: string): string => {
    const typeMap: Record<string, string> = {
      promotional: "promocional",
      transactional: "transaccional",
      news: "noticias",
      reminder: "recordatorio",
      "abandoned-cart": "carrito-abandonado",
    };
    return typeMap[type] || type;
  };

  // Map purchase operator to backend format
  const mapPurchaseOperator = (operator: string): string => {
    const operatorMap: Record<string, string> = {
      greater: "greater_than",
      greaterEqual: "greater_than_or_equal",
      equal: "equal",
      lessEqual: "less_than_or_equal",
      less: "less_than",
    };
    return operatorMap[operator] || operator;
  };

  // Map display style to backend format
  const mapDisplayStyle = (style: string): string => {
    const styleMap: Record<string, string> = {
      popup: "modal",
      slider: "slider",
    };
    return styleMap[style] || style;
  };

  // Capitalize urgency value
  const capitalizeUrgency = (urgency: string): string => {
    const urgencyMap: Record<string, string> = {
      "very-low": "Muy Baja",
      low: "Baja",
      normal: "Normal",
      high: "Alta",
    };
    return urgencyMap[urgency] || urgency.charAt(0).toUpperCase() + urgency.slice(1);
  };

  // Extract path from URL or return as-is if already a path
  const extractPathFromUrl = (url: string): string => {
    if (!url) return "/ofertas";
    if (url.startsWith("/")) return url;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || "/ofertas";
    } catch {
      return url.startsWith("/") ? url : `/${url}`;
    }
  };

  // Transform frontend data to JSON for PATCH endpoint
  const transformToUpdateRequest = (data: typeof inWebData) => {
    const updatePayload: any = {};

    // Campaign info
    if (data.campaignName || data.campaignType) {
      updatePayload.campaign = {};
      if (data.campaignName) updatePayload.campaign.name = data.campaignName;
      if (data.campaignType) updatePayload.campaign.type = mapCampaignType(data.campaignType);
    }

    // Targeting
    updatePayload.targeting = {
      audience: data.targetAudience || "all",
      cities: data.selectedCities || [],
      ageRange: {
        min: data.minAge || 18,
        max: data.maxAge || 65,
      },
      purchaseFilter: {
        operator: mapPurchaseOperator(data.purchaseOperator || "equal"),
        count: data.purchaseCount || 0,
      },
    };

    // Content
    updatePayload.content = {
      type: data.contentType,
      url: data.url || "",
      previewUrl: extractPathFromUrl(data.previewUrl || "/ofertas"),
    };

    // Si es imagen, usar la URL existente o la nueva si se subió
    if (data.contentType === "image") {
      // Si hay una nueva imagen (imageFile), usar la URL existente por ahora
      // En el futuro, se podría subir primero y obtener la URL
      updatePayload.content.image = data.image || "";
    } else {
      updatePayload.content.htmlContent = data.htmlContent || null;
    }

    // Behavior
    updatePayload.behavior = {
      displayStyle: mapDisplayStyle(data.displayStyle || "popup"),
      ttl: data.ttl,
      urgency: capitalizeUrgency(data.urgency),
      enableFallback: data.enableFallback !== false,
    };

    // Frequency cap
    updatePayload.enableFrequencyCap = data.enableFrequencyCap || false;
    updatePayload.frequencyCap = {
      maxPerDay: data.maxPerDay || 3,
      maxPerWeek: data.maxPerWeek || 10,
    };

    // Scheduling
    updatePayload.scheduling = {
      sendImmediately: data.sendImmediately,
    };

    if (data.sendImmediately) {
      updatePayload.scheduling.initialDate = (data.scheduledDate || new Date()).toISOString();
    } else {
      if (data.scheduledDate) {
        updatePayload.scheduling.initialDate = data.scheduledDate.toISOString();
      }
    }

    if (data.finalDate) {
      updatePayload.scheduling.finalDate = data.finalDate.toISOString();
    }

    // A/B Test
    updatePayload.enableABTest = data.enableABTest || false;
    updatePayload.abTest = {
      enabled: data.enableABTest || false,
      percentage: data.enableABTest ? data.abTestPercentage : null,
    };

    return updatePayload;
  };

  const handleSave = async () => {
    if (!inWebData.campaignName.trim()) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    if (inWebData.contentType === "image" && !inWebData.image && !inWebData.imageFile) {
      toast.error("Debes subir una imagen para la campaña");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = transformToUpdateRequest(inWebData);
      const response = await campaignEndpoints.updateInWebCampaign(campaignId, updateData);

      if (response.success) {
        toast.success("Campaña actualizada como borrador");
        router.push("/marketing/campaigns");
      } else {
        toast.error(response.message || "Error al actualizar la campaña");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Error al actualizar la campaña. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inWebData.campaignName.trim()) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    if (inWebData.contentType === "image" && !inWebData.image && !inWebData.imageFile) {
      toast.error("Debes subir una imagen para la campaña");
      return;
    }

    if (!inWebData.sendImmediately && !inWebData.scheduledDate) {
      toast.error("Debes seleccionar una fecha de inicio para campañas programadas");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = transformToUpdateRequest(inWebData);
      updateData.status = "active";
      const response = await campaignEndpoints.updateInWebCampaign(campaignId, updateData);

      if (response.success) {
        toast.success("Campaña actualizada exitosamente");
        router.push("/marketing/campaigns");
      } else {
        toast.error(response.message || "Error al actualizar la campaña");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Error al actualizar la campaña. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignInfoChange = (data: CampaignInfoData) => {
    setInWebData((prev) => ({ ...prev, ...data }));
  };

  const handleSegmentationChange = (segmentationData: AudienceSegmentationData) => {
    setInWebData((prev) => ({
      ...prev,
      ...segmentationData,
    }));
  };

  const handleBehaviorSettingsChange = (data: BehaviorSettingsData) => {
    setInWebData((prev) => ({ ...prev, ...data }));
  };

  const handleNotificationContentChange = (data: NotificationContentData) => {
    setInWebData((prev) => ({ ...prev, ...data }));
  };

  const handleSchedulingSettingsChange = (data: SchedulingSettingsData) => {
    setInWebData((prev) => ({ ...prev, ...data }));
  };

  if (isLoadingCampaign) {
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
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="p-4 border border-destructive rounded-lg">
          <p className="text-destructive">
            {error?.message || "No se pudo cargar la campaña"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sticky Header */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 -mx-4 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Editar Campaña InWeb
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="font-semibold">Vista Previa</span>
            </div>
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Form */}
        <div className="space-y-3">
          <CampaignInfo
            data={{
              campaignName: inWebData.campaignName,
              campaignType: inWebData.campaignType,
            }}
            onChange={handleCampaignInfoChange}
          />

          <AudienceSegmentation
            data={{
              targetAudience: inWebData.targetAudience,
              selectedCities: inWebData.selectedCities,
              purchaseOperator: inWebData.purchaseOperator,
              purchaseCount: inWebData.purchaseCount,
              minAge: inWebData.minAge,
              maxAge: inWebData.maxAge,
            }}
            onChange={handleSegmentationChange}
          />

          <BehaviorSettings
            data={{
              displayStyle: inWebData.displayStyle,
              enableFrequencyCap: inWebData.enableFrequencyCap,
              maxPerDay: inWebData.maxPerDay,
              maxPerWeek: inWebData.maxPerWeek,
              ttl: inWebData.ttl,
              urgency: inWebData.urgency,
            }}
            onChange={handleBehaviorSettingsChange}
          />

          <NotificationContent
            data={{
              contentType: inWebData.contentType,
              image: inWebData.image,
              imageFile: inWebData.imageFile,
              url: inWebData.url,
              previewUrl: inWebData.previewUrl,
              htmlContent: inWebData.htmlContent,
            }}
            onChange={handleNotificationContentChange}
            displayStyle={inWebData.displayStyle}
          />

          <SchedulingSettings
            data={{
              sendImmediately: inWebData.sendImmediately,
              scheduledDate: inWebData.scheduledDate,
              finalDate: inWebData.finalDate,
              enableABTest: inWebData.enableABTest,
              abTestPercentage: inWebData.abTestPercentage,
            }}
            onChange={handleSchedulingSettingsChange}
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              className="flex-1"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
            <Button onClick={handleSend} className="flex-1" disabled={isLoading}>
              <Send className="mr-2 h-4 w-4" />
              Actualizar y Activar
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="sticky top-[110px]">
            <InWebPreview
              image={inWebData.image}
              previewUrl={inWebData.previewUrl}
              displayStyle={inWebData.displayStyle}
              contentType={inWebData.contentType}
              htmlContent={inWebData.htmlContent}
              mode={previewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

