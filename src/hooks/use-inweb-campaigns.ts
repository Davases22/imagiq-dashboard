import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { campaignEndpoints, InWebCampaignResponse, InWebCampaignsListResponse } from '@/lib/api';
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
 * Hook para obtener y gestionar campañas InWeb desde la API
 */
export function useInWebCampaigns(params: UseInWebCampaignsParams = {}): UseInWebCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Mapea una campaña de la API al formato Campaign del frontend
   */
  const mapCampaignFromAPI = (apiCampaign: InWebCampaignResponse): Campaign => {
    return {
      id: apiCampaign.id,
      name: apiCampaign.campaign_name,
      type: 'in-web',
      status: apiCampaign.status,
      reach: 0, // Métricas aún no disponibles
      clicks: 0, // Métricas aún no disponibles
      conversions: 0, // Métricas aún no disponibles
      createdAt: new Date(apiCampaign.created_at),
    };
  };

  /**
   * Obtiene las campañas desde la API
   */
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await campaignEndpoints.getInWebCampaigns({
        page: params.page || 1,
        limit: params.limit || 10,
        status: params.status,
      });

      // apiClient.get retorna { data, success, message }
      if (!response.success) {
        throw new Error(response.message || 'Error al obtener campañas');
      }

      // response.data es InWebCampaignsListResponse que tiene { data: [...], total, page, limit }
      const campaignsData = response.data as InWebCampaignsListResponse;
      
      if (!campaignsData || !Array.isArray(campaignsData.data)) {
        throw new Error('Formato de respuesta inesperado');
      }

      const mappedCampaigns = campaignsData.data.map(mapCampaignFromAPI);
      setCampaigns(mappedCampaigns);
      setTotal(campaignsData.total || campaignsData.data.length);
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
      // Refrescar la lista después de eliminar
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
      // Refrescar la lista después de pausar
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

