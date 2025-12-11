"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Monitor,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { campaignEndpoints, InWebCampaignRequest } from "@/lib/api";
import { toast } from "sonner";

export default function CrearCampaignInWebPage() {
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isLoading, setIsLoading] = useState(false);

  const [inWebData, setInWebData] = useState<{
    campaignName: string;
    campaignType: string;
    targetAudience: string;

    image: string;
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
    // Campaign Info
    campaignName: "",
    campaignType: "promotional",
    targetAudience: "all",

    // Notification Content
    image: "",
    url: "",
    previewUrl: "",



    // Behavior Settings
    displayStyle: "popup", // "popup" (bloqueante) o "slider" (tipo toast)

    // Audience Segmentation
    selectedCities: [] as string[],
    purchaseOperator: "equal",
    purchaseCount: 0,
    minAge: 18,
    maxAge: 65,

    // Timing
    sendImmediately: true,
    scheduledDate: null as Date | null,
    finalDate: null as Date | null,

    // Frequency Capping
    enableFrequencyCap: false,
    maxPerDay: 3,
    maxPerWeek: 10,

    // A/B Testing
    enableABTest: false,
    abTestPercentage: 50,

    // Advanced
    ttl: 3600, // Default to 1 hour in seconds
    urgency: "normal",
    enableFallback: true,

    // Content Type
    contentType: "image",
    htmlContent: "",
  });



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

  // Transform frontend data to backend format
  const transformToBackendFormat = (data: typeof inWebData): InWebCampaignRequest => {
    const request: InWebCampaignRequest = {
      campaign: {
        name: data.campaignName,
        type: mapCampaignType(data.campaignType),
      },
      content: {
        type: data.contentType,
        image: data.image || "",
        url: data.url || "",
        previewUrl: data.previewUrl || "*",
        htmlContent: data.htmlContent || "",
      },
      behavior: {
        displayStyle: data.displayStyle || "",
        ttl: data.ttl,
        urgency: capitalizeUrgency(data.urgency),
      },
      scheduling: {
        sendImmediately: data.sendImmediately,
      },
    };

    // Add dates if not sending immediately
    if (!data.sendImmediately) {
      if (data.scheduledDate) {
        request.scheduling.initialDate = data.scheduledDate.toISOString();
      }
      if (data.finalDate) {
        request.scheduling.finalDate = data.finalDate.toISOString();
      }
    }

    return request;
  };

  const handleSave = async () => {
    if (!inWebData.campaignName.trim()) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const requestData = transformToBackendFormat(inWebData);
      const response = await campaignEndpoints.createInWeb(requestData);

      if (response.success) {
        toast.success("Campaña guardada como borrador");
        router.push("/marketing/campaigns");
      } else {
        toast.error(response.message || "Error al guardar la campaña");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error("Error al guardar la campaña. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inWebData.campaignName.trim()) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    if (!inWebData.sendImmediately && !inWebData.scheduledDate) {
      toast.error("Debes seleccionar una fecha de inicio para campañas programadas");
      return;
    }

    setIsLoading(true);
    try {
      const requestData = transformToBackendFormat(inWebData);
      const response = await campaignEndpoints.createInWeb(requestData);

      if (response.success) {
        toast.success("Campaña creada exitosamente");
        router.push("/marketing/campaigns");
      } else {
        toast.error(response.message || "Error al crear la campaña");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Error al crear la campaña. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignInfoChange = (data: CampaignInfoData) => {
    setInWebData((prev) => ({ ...prev, ...data }));
  };

  const handleSegmentationChange = (
    segmentationData: AudienceSegmentationData
  ) => {
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

  return (
    <div className="space-y-3">
      {/* Sticky Header con botón Volver y Vista Previa - debajo del header del layout */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 -mx-4 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Lado izquierdo: Volver y Título */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Crear Campaña InWeb
              </h1>
            </div>
          </div>

          {/* Lado derecho: Vista Previa con tabs */}
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
          {/* Campaign Info */}
          <CampaignInfo
            data={{
              campaignName: inWebData.campaignName,
              campaignType: inWebData.campaignType,
            }}
            onChange={handleCampaignInfoChange}
          />

          {/* Audience Segmentation */}
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

          {/* Behavior Settings */}
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

          {/* Notification Content */}
          <NotificationContent
            data={{
              contentType: inWebData.contentType,
              image: inWebData.image,
              url: inWebData.url,
              previewUrl: inWebData.previewUrl,
              htmlContent: inWebData.htmlContent,
            }}
            onChange={handleNotificationContentChange}
            displayStyle={inWebData.displayStyle}
          />

          {/* Scheduling */}
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
              Guardar Borrador
            </Button>
            <Button 
              onClick={handleSend} 
              className="flex-1"
              disabled={isLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Crear
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
