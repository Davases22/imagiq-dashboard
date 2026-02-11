"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OfertaBasicFields } from "@/components/ofertas/oferta-basic-fields";
import { OfertaBannersManager } from "@/components/ofertas/oferta-banners-manager";
import { OfertaFaqSection } from "@/components/ofertas/oferta-faq-section";
import { LandingPagePreview } from "@/components/landing-pages/preview/landing-preview";
import { FormFieldsBuilder } from "./form-fields-builder";
import { FormLayoutSelector } from "./form-layout-selector";
import { FormSuccessConfigComponent } from "./form-success-config";
import { FormStyleConfig } from "./form-style-config";
import { useFormBuilder } from "@/hooks/use-form-builder";
import type { FormLayoutType } from "@/types/form-page";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const LAYOUT_BANNER_RECOMMENDATIONS: Record<string, { desktop: string; mobile: string; tip: string }> = {
  banner_top: { desktop: "2520 x 620px (horizontal ~4:1)", mobile: "828 x 620px (~4:3)", tip: "Imagen horizontal panorámica" },
  banner_left: { desktop: "800 x 1200px (vertical 2:3)", mobile: "828 x 620px (~4:3)", tip: "Imagen vertical tipo portrait" },
  banner_right: { desktop: "800 x 1200px (vertical 2:3)", mobile: "828 x 620px (~4:3)", tip: "Imagen vertical tipo portrait" },
  banner_behind: { desktop: "1920 x 1080px (16:9)", mobile: "1080 x 1920px (9:16)", tip: "Imagen de fondo a pantalla completa" },
};

function BannerRecommendation({ layoutType }: { readonly layoutType: FormLayoutType }) {
  const rec = LAYOUT_BANNER_RECOMMENDATIONS[layoutType];
  if (!rec) return null;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="text-xs">
        <strong>Dimensiones recomendadas:</strong> Desktop {rec.desktop} · Mobile {rec.mobile}
        <br />
        <span className="text-muted-foreground">{rec.tip}</span>
      </AlertDescription>
    </Alert>
  );
}

interface FormPageFormProps {
  pageId?: string;
  mode: "create" | "edit";
  onCancel: () => void;
}

export function FormPageForm({ pageId, mode, onCancel }: FormPageFormProps) {
  const isEditMode = mode === "edit";
  const form = useFormBuilder({ pageId, returnPath: "/pagina-web/formularios" });

  // Base64 previews para que el iframe (otro puerto) pueda mostrar las imágenes
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const processImages = async () => {
      const newPreviews: Record<string, string> = {};
      let hasChanges = false;

      for (const banner of form.banners) {
        const dKey = `${banner.id}-desktop`;
        if (banner.files.desktop_image && !imagePreviews[dKey]) {
          try {
            newPreviews[dKey] = await fileToBase64(banner.files.desktop_image);
            hasChanges = true;
          } catch (e) { console.error(e); }
        }
        const mKey = `${banner.id}-mobile`;
        if (banner.files.mobile_image && !imagePreviews[mKey]) {
          try {
            newPreviews[mKey] = await fileToBase64(banner.files.mobile_image);
            hasChanges = true;
          } catch (e) { console.error(e); }
        }
      }

      if (hasChanges) {
        setImagePreviews(prev => ({ ...prev, ...newPreviews }));
      }
    };

    processImages();
  }, [form.banners, imagePreviews]);

  // Loading skeleton for edit mode
  if (form.loading && isEditMode) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <div><Skeleton className="h-[500px]" /></div>
      </div>
    );
  }

  // Preview data for iframe
  const previewData = {
    page: {
      title: form.titulo,
      slug: form.titulo.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nuevo-formulario',
      page_type: "form",
      form_config: {
        fields: form.formFields,
        submit_button_text: form.submitButtonText,
      },
      form_layout: form.formLayout,
      form_success_config: form.formSuccessConfig,
    },
    banners: form.bannersEnabled ? form.banners.map(b => ({
      ...b.data,
      desktop_image_url: b.files.desktop_image ? (imagePreviews[`${b.id}-desktop`] || '') : b.data.desktop_image_url,
      mobile_image_url: b.files.mobile_image ? (imagePreviews[`${b.id}-mobile`] || '') : b.data.mobile_image_url,
    })) : [],
    faqs: form.faqEnabled ? form.faqItems.filter(f => f.question.trim() && f.answer.trim()).map(f => ({
      pregunta: f.question,
      respuesta: f.answer,
      activo: true,
    })) : [],
  };

  return (
    <form
      onSubmit={form.handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Form Sections */}
        <div className="space-y-6">
          {/* Basic Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Página</CardTitle>
              <CardDescription>Datos básicos del formulario</CardDescription>
            </CardHeader>
            <CardContent>
              <OfertaBasicFields
                titulo={form.titulo}
                descripcion={form.descripcion}
                fechaInicio={form.fechaInicio}
                fechaFin={form.fechaFin}
                onFieldChange={form.handleFieldChange}
              />
            </CardContent>
          </Card>

          {/* Form Fields Builder (main section) */}
          <Card>
            <CardHeader>
              <CardTitle>Campos del Formulario</CardTitle>
              <CardDescription>Arrastra para reordenar los campos</CardDescription>
            </CardHeader>
            <CardContent>
              <FormFieldsBuilder
                fields={form.formFields}
                onFieldsChange={form.reorderFormFields}
                onAddField={form.addFormField}
                onRemoveField={form.removeFormField}
                onUpdateField={form.updateFormField}
              />
            </CardContent>
          </Card>

          {/* Banners (optional, with toggle) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Banners</CardTitle>
                <CardDescription>Agrega banners promocionales</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="banners-switch">Habilitar</Label>
                <Switch
                  id="banners-switch"
                  checked={form.bannersEnabled}
                  onCheckedChange={form.setBannersEnabled}
                />
              </div>
            </CardHeader>
            {form.bannersEnabled && (
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Layout del Formulario</Label>
                  <p className="text-xs text-muted-foreground mb-3">Elige cómo se muestra el formulario con los banners</p>
                  <FormLayoutSelector
                    layout={form.formLayout}
                    onLayoutChange={form.setFormLayout}
                  />
                </div>
                <Separator />
                <BannerRecommendation layoutType={form.formLayout.type} />
                <OfertaBannersManager
                  banners={form.banners}
                  onBannersChange={form.handleBannersChange}
                  onActiveBannerChange={form.setActiveBannerId}
                  activeBannerId={form.activeBannerId}
                  hideContentBlocks
                />
              </CardContent>
            )}
          </Card>

          {/* Style & Button Config */}
          <Card>
            <CardHeader>
              <CardTitle>Estilo del Formulario</CardTitle>
              <CardDescription>Personaliza el botón de envío y colores</CardDescription>
            </CardHeader>
            <CardContent>
              <FormStyleConfig
                submitButtonText={form.submitButtonText}
                onSubmitButtonTextChange={form.setSubmitButtonText}
              />
            </CardContent>
          </Card>

          {/* Success Config */}
          <Card>
            <CardHeader>
              <CardTitle>Después del Envío</CardTitle>
              <CardDescription>Qué sucede cuando el usuario envía el formulario</CardDescription>
            </CardHeader>
            <CardContent>
              <FormSuccessConfigComponent
                config={form.formSuccessConfig}
                onConfigChange={form.setFormSuccessConfig}
              />
            </CardContent>
          </Card>

          {/* FAQs (optional) */}
          <OfertaFaqSection
            enabled={form.faqEnabled}
            items={form.faqItems}
            onEnabledChange={form.setFaqEnabled}
            onItemsChange={form.setFaqItems}
          />

          {/* Active State & Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Label>Página activa</Label>
                  <p className="text-sm text-muted-foreground">Los usuarios podrán ver esta página</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={form.setIsActive} />
              </div>
              <Separator className="mb-6" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={!form.isFormValid || form.saving}>
                  {form.saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />{isEditMode ? "Guardar Cambios" : "Crear Formulario"}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:sticky lg:top-40 lg:self-start lg:h-[calc(100vh-12rem)]">
          <LandingPagePreview data={previewData} baseUrl={process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"} />
        </div>
      </div>
    </form>
  );
}
