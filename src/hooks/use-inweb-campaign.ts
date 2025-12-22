import { useState, useEffect, useCallback } from 'react';
import { campaignEndpoints, InWebCampaignResponse } from '@/lib/api';
import { toast } from 'sonner';

interface UseInWebCampaignReturn {
  campaign: InWebCampaignResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener una campaña InWeb individual por ID
 */
export function useInWebCampaign(id: string): UseInWebCampaignReturn {
  const [campaign, setCampaign] = useState<InWebCampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Obtiene la campaña desde la API
   */
  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await campaignEndpoints.getInWebCampaign(id);

      // apiClient.get retorna { data, success, message }
      if (!response.success) {
        throw new Error(response.message || 'Error al obtener la campaña');
      }

      setCampaign(response.data as InWebCampaignResponse);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al obtener la campaña');
      setError(error);
      toast.error('Error al cargar la campaña');
      console.error('Error fetching campaign:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Cargar campaña al montar el componente o cuando cambie el ID
  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return {
    campaign,
    isLoading,
    error,
    refetch: fetchCampaign,
  };
}

