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
import { campaignEndpoints } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function CrearCampaignInWebPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isLoading, setIsLoading] = useState(false);

  const [inWebData, setInWebData] = useState<{
    campaignName: string;
    campaignType: string;
    targetAudience: string;

    image: string; // Base64 preview
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
    // Campaign Info
    campaignName: "",
    campaignType: "promotional",
    targetAudience: "all",

    // Notification Content
    image: "", // Base64 preview
    imageFile: null as File | null, // File object for upload
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
    // If it's already a path (starts with /), return as-is
    if (url.startsWith("/")) return url;
    // If it's a full URL, extract the path
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || "/ofertas";
    } catch {
      // If URL parsing fails, assume it's a path
      return url.startsWith("/") ? url : `/${url}`;
    }
  };

  // Transform frontend data to FormData for backend
  const transformToFormData = (data: typeof inWebData): FormData => {
    const formData = new FormData();

    // Build the complete campaign payload matching backend structure
    const campaignPayload: any = {
      campaign: {
        name: data.campaignName,
        type: mapCampaignType(data.campaignType),
        channel: "inweb",
      },
      targeting: {
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
      },
      content: {
        type: data.contentType,
        image: "", // Will be set after image upload returns URL
        url: data.url || "",
        htmlContent: data.contentType === "html" ? data.htmlContent : null,
        previewUrl: extractPathFromUrl(data.previewUrl || "/ofertas"), // Extract path from URL
      },
      behavior: {
        displayStyle: mapDisplayStyle(data.displayStyle || "popup"),
        ttl: data.ttl,
        urgency: capitalizeUrgency(data.urgency),
        enableFallback: data.enableFallback !== false, // Default to true
      },
      enableFrequencyCap: data.enableFrequencyCap || false,
      frequencyCap: {
        maxPerDay: data.maxPerDay || 3,
        maxPerWeek: data.maxPerWeek || 10,
      },
      scheduling: {
        sendImmediately: data.sendImmediately,
      },
      enableABTest: data.enableABTest || false,
      abTest: {
        enabled: data.enableABTest || false,
        percentage: data.enableABTest ? data.abTestPercentage : null,
      },
      createdBy: user?.id || user?.email || "unknown",
    };

    // Always set initialDate
    // If sendImmediately is true, use current time (or scheduledDate if already set)
    // If sendImmediately is false, use the user-selected scheduledDate
    if (data.sendImmediately) {
      // Use current time if sendImmediately is true
      campaignPayload.scheduling.initialDate = (data.scheduledDate || new Date()).toISOString();
    } else {
      // Use user-selected date if sendImmediately is false
      if (data.scheduledDate) {
        campaignPayload.scheduling.initialDate = data.scheduledDate.toISOString();
      }
    }

    // Always add finalDate if provided
    if (data.finalDate) {
      campaignPayload.scheduling.finalDate = data.finalDate.toISOString();
    }

    // Append campaign data as JSON (backend expects "data" field)
    formData.append("data", JSON.stringify(campaignPayload));

    // Append image file if exists (backend expects "file" field)
    if (data.imageFile && data.contentType === "image") {
      formData.append("file", data.imageFile, data.imageFile.name);
    }

    return formData;
  };

  const handleSave = async () => {
    if (!inWebData.campaignName.trim()) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    if (inWebData.contentType === "image" && !inWebData.imageFile) {
      toast.error("Debes subir una imagen para la campaña");
      return;
    }

    setIsLoading(true);
    try {
      const formData = transformToFormData(inWebData);
      const response = await campaignEndpoints.createInWeb(formData);

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

    if (inWebData.contentType === "image" && !inWebData.imageFile) {
      toast.error("Debes subir una imagen para la campaña");
      return;
    }

    if (!inWebData.sendImmediately && !inWebData.scheduledDate) {
      toast.error("Debes seleccionar una fecha de inicio para campañas programadas");
      return;
    }

    setIsLoading(true);
    try {
      const formData = transformToFormData(inWebData);
      const response = await campaignEndpoints.createInWeb(formData);

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
              imageFile: inWebData.imageFile,
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

