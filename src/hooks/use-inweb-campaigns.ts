import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { campaignEndpoints, InWebCampaignResponse, InWebCampaignsListResponse, emailCampaignEndpoints, EmailCampaignResponse, whatsappCampaignEndpoints, WhatsAppCampaignResponse } from '@/lib/api';
import { toast } from 'sonner';

interface UseInWebCampaignsParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface UseInWebCampaignsReturn {
  campaigns: Campaign[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
}

/**
 * Hook para obtener y gestionar campañas InWeb + Email desde la API
 */
export function useInWebCampaigns(params: UseInWebCampaignsParams = {}): UseInWebCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Mapea una campaña InWeb de la API al formato Campaign del frontend
   */
  const mapInWebCampaign = (apiCampaign: InWebCampaignResponse): Campaign => {
    // Estado honesto: en BD nada expira el status ('active' para siempre),
    // así que campañas vencidas hace meses salían como "Activa". Si la fecha
    // final ya pasó, se muestra completada sin importar el status guardado.
    const vencida =
      apiCampaign.final_date && new Date(apiCampaign.final_date) < new Date();
    const status = (
      vencida && apiCampaign.status === 'active' ? 'completed' : apiCampaign.status
    ) as Campaign['status'];

    return {
      id: apiCampaign.id,
      name: apiCampaign.campaign_name,
      type: 'in-web',
      status,
      // Métricas reales de PostHog (impresiones/clics), inyectadas por el
      // gateway. Antes iban hardcodeadas en 0 y toda campaña in-web mostraba
      // "-" aunque el tracking existiera.
      reach: apiCampaign.impressions ?? 0,
      clicks: apiCampaign.clicks ?? 0,
      conversions: apiCampaign.redirects ?? 0,
      createdAt: new Date(apiCampaign.created_at),
    };
  };

  /**
   * Mapea una campaña Email de la API al formato Campaign del frontend
   */
  const mapEmailCampaign = (apiCampaign: EmailCampaignResponse): Campaign => {
    // Si completedAt está seteado, el envío terminó — aunque el status de la DB
    // se haya quedado en 'sending' por un crash del background processor.
    let derivedStatus = apiCampaign.status as Campaign['status'];
    if (apiCampaign.completedAt && apiCampaign.status === 'sending') {
      derivedStatus =
        apiCampaign.failedSends > 0 &&
        apiCampaign.failedSends === apiCampaign.totalRecipients
          ? ('failed' as Campaign['status'])
          : ('completed' as Campaign['status']);
    }

    return {
      id: apiCampaign.id,
      name: apiCampaign.name || apiCampaign.subject || 'Sin nombre',
      type: 'email',
      status: derivedStatus,
      reach: apiCampaign.totalRecipients || 0,
      clicks: apiCampaign.clickCount || apiCampaign.uniqueClicks || 0,
      conversions: apiCampaign.openCount || apiCampaign.uniqueOpens || 0,
      createdAt: new Date(apiCampaign.createdAt),
      subject: apiCampaign.subject,
      totalRecipients: apiCampaign.totalRecipients,
      successfulSends: apiCampaign.successfulSends,
      failedSends: apiCampaign.failedSends,
    };
  };

  /**
   * Mapea una campaña de WhatsApp (envío masivo de plantilla) al formato
   * Campaign. El alcance es el total de destinatarios y las "aperturas" por
   * campaña no existen aún (las lecturas se miden a nivel de plantilla), así
   * que van en 0 y la tabla las muestra como "-".
   */
  const mapWhatsAppCampaign = (c: WhatsAppCampaignResponse): Campaign => {
    const filtro = c.filtro
      ? [c.filtro.categoria, c.filtro.subcategoria, c.filtro.submenu]
          .filter(Boolean)
          .join('/')
      : '';
    return {
      id: c.id,
      name: `${c.templateName}${filtro ? ` (${filtro})` : ''}`,
      type: 'whatsapp',
      status: (c.status === 'sending'
        ? 'sending'
        : c.status === 'failed'
          ? 'failed'
          : 'completed') as Campaign['status'],
      reach: c.totalDestinatarios || 0,
      // Los clics de WhatsApp no se rastrean (los botones de URL de Meta no
      // notifican); las aperturas sí: son los "leídos" que reporta el webhook
      // de Meta a nivel de plantilla.
      clicks: 0,
      conversions: c.leidos ?? 0,
      createdAt: new Date(c.createdAt),
      totalRecipients: c.totalDestinatarios,
      successfulSends: c.enviados,
      failedSends: c.fallidos,
    };
  };

  /**
   * Obtiene las campañas desde la API (InWeb + Email + WhatsApp)
   */
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both InWeb and Email campaigns in parallel
      const [inWebResponse, emailResponse, whatsappResponse] = await Promise.allSettled([
        campaignEndpoints.getInWebCampaigns({
          page: params.page || 1,
          limit: params.limit || 100,
          status: params.status,
        }),
        emailCampaignEndpoints.getAll({
          page: 1,
          limit: 100,
        }),
        whatsappCampaignEndpoints.getAll(),
      ]);

      let allCampaigns: Campaign[] = [];

      // Process InWeb campaigns
      if (inWebResponse.status === 'fulfilled' && inWebResponse.value.success) {
        const campaignsData = inWebResponse.value.data as InWebCampaignsListResponse;
        if (campaignsData && Array.isArray(campaignsData.data)) {
          allCampaigns.push(...campaignsData.data.map(mapInWebCampaign));
        }
      }

      // Process Email campaigns
      if (emailResponse.status === 'fulfilled' && emailResponse.value.success) {
        const emailData = emailResponse.value.data as { data: EmailCampaignResponse[]; total: number };
        if (emailData && Array.isArray(emailData.data)) {
          allCampaigns.push(...emailData.data.map(mapEmailCampaign));
        }
      }

      // Process WhatsApp campaigns (envíos masivos de plantillas)
      if (whatsappResponse.status === 'fulfilled' && whatsappResponse.value.success) {
        const waData = whatsappResponse.value.data as { data: WhatsAppCampaignResponse[]; total: number };
        if (waData && Array.isArray(waData.data)) {
          allCampaigns.push(...waData.data.map(mapWhatsAppCampaign));
        }
      }

      // Sort by createdAt descending
      allCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setCampaigns(allCampaigns);
      setTotal(allCampaigns.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al obtener campañas');
      setError(error);
      toast.error('Error al cargar las campañas');
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Elimina una campaña
   */
  const deleteCampaign = async (id: string) => {
    try {
      const response = await campaignEndpoints.deleteInWebCampaign(id);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar la campaña');
      }

      toast.success('Campaña eliminada correctamente');
      await fetchCampaigns();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al eliminar la campaña');
      toast.error('Error al eliminar la campaña');
      console.error('Error deleting campaign:', err);
      throw error;
    }
  };

  /**
   * Pausa una campaña (cambia el estado a 'paused')
   */
  const pauseCampaign = async (id: string) => {
    try {
      const response = await campaignEndpoints.updateInWebCampaignStatus(id, 'paused');

      if (!response.success) {
        throw new Error(response.message || 'Error al pausar la campaña');
      }

      toast.success('Campaña pausada correctamente');
      await fetchCampaigns();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al pausar la campaña');
      toast.error('Error al pausar la campaña');
      console.error('Error pausing campaign:', err);
      throw error;
    }
  };

  // Cargar campañas al montar el componente o cuando cambien los parámetros
  useEffect(() => {
    fetchCampaigns();
  }, [params.page, params.limit, params.status]);

  return {
    campaigns,
    isLoading,
    error,
    total,
    refetch: fetchCampaigns,
    deleteCampaign,
    pauseCampaign,
  };
}
