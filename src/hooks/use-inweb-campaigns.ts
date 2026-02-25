import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { campaignEndpoints, InWebCampaignResponse, InWebCampaignsListResponse, emailCampaignEndpoints, EmailCampaignResponse } from '@/lib/api';
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
    return {
      id: apiCampaign.id,
      name: apiCampaign.campaign_name,
      type: 'in-web',
      status: apiCampaign.status,
      reach: 0,
      clicks: 0,
      conversions: 0,
      createdAt: new Date(apiCampaign.created_at),
    };
  };

  /**
   * Mapea una campaña Email de la API al formato Campaign del frontend
   */
  const mapEmailCampaign = (apiCampaign: EmailCampaignResponse): Campaign => {
    return {
      id: apiCampaign.id,
      name: apiCampaign.name || apiCampaign.subject || 'Sin nombre',
      type: 'email',
      status: apiCampaign.status as Campaign['status'],
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
   * Obtiene las campañas desde la API (InWeb + Email)
   */
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both InWeb and Email campaigns in parallel
      const [inWebResponse, emailResponse] = await Promise.allSettled([
        campaignEndpoints.getInWebCampaigns({
          page: params.page || 1,
          limit: params.limit || 100,
          status: params.status,
        }),
        emailCampaignEndpoints.getAll({
          page: 1,
          limit: 100,
        }),
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
