import { toast } from "sonner";

import { useState, useEffect } from "react";
import { ofertasDestacadasEndpoints, OfertaDestacada } from "@/lib/api";

interface OfertaConProducto extends OfertaDestacada {
  producto_nombre?: string;
  producto_imagen?: string;
  link_url?: string;
}

export function useOfertasDestacadas() {
  const [ofertas, setOfertas] = useState<OfertaConProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOferta, setUpdatingOferta] = useState<string | null>(null);
  const [deletingOferta, setDeletingOferta] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const fetchOfertas = async () => {
    try {
      setLoading(true);
      const response = await ofertasDestacadasEndpoints.getAll();

      // El backend devuelve { success: true, data: [...] }
      // Y el ApiClient lo wrappea en { data: {...}, success: true }
      const backendData = (response.data as any)?.data || response.data;

      if (response.success && backendData && Array.isArray(backendData)) {
        // El backend ahora trae los datos enriquecidos directamente
        const ofertasConProducto = backendData.map((oferta: OfertaDestacada) => {
          const producto = oferta.producto;

          // Validar que la imagen sea una URL válida
          const imagen = producto?.imagen || "";
          const imagenValida = imagen && imagen.startsWith("http") ? imagen : "";

          return {
            ...oferta,
            producto_nombre: producto?.nombreMarket || oferta.nombre || "",
            producto_imagen: imagenValida,
            link_url: producto?.sku
              ? `/productos/${producto.categoria}/${producto.menu}/${producto.sku}`
              : "",
          };
        });

        setOfertas(ofertasConProducto);
        setError(null);
      } else {
        setError("No se pudieron cargar las ofertas");
      }
    } catch (err) {
      console.error("Error al cargar ofertas:", err);
      setError("Error al cargar las ofertas destacadas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfertas();
  }, []);

  const toggleOfertaActive = async (uuid: string) => {
    try {
      setUpdatingOferta(uuid);
      const oferta = ofertas.find((o) => o.uuid === uuid);
      if (!oferta) return false;

      const response = await ofertasDestacadasEndpoints.update(uuid, {
        activo: !oferta.activo,
      });

      if (response.success) {
        await fetchOfertas();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error al actualizar oferta:", err);
      return false;
    } finally {
      setUpdatingOferta(null);
    }
  };

  const deleteOferta = async (uuid: string) => {
    try {
      setDeletingOferta(uuid);
      const response = await ofertasDestacadasEndpoints.delete(uuid);

      // Considerar éxito si response.success o si la respuesta es vacía pero el status HTTP fue 200/204
      if (response.success || response === undefined) {
        await fetchOfertas();
        return true;
      }
      // Si la API responde con success false, mostrar mensaje
      if (response && response.message) {
        toast.error(`No se pudo eliminar la oferta: ${response.message}`);
      } else {
        toast.error("No se pudo eliminar la oferta (error desconocido)");
      }
      return false;
    } catch (err: any) {
      // Manejo de errores HTTP específicos
      if (err && err.message) {
        if (err.message.includes("404")) {
          toast.error("La oferta ya no existe o ya fue eliminada (404)");
        } else if (err.message.includes("400")) {
          toast.error("Solicitud incorrecta al eliminar la oferta (400)");
        } else {
          toast.error(`Error al eliminar oferta: ${err.message}`);
        }
      } else {
        toast.error("Error desconocido al eliminar la oferta");
      }
      console.error("Error al eliminar oferta:", err);
      return false;
    } finally {
      setDeletingOferta(null);
    }
  };

  const updateOfertasOrder = async (uuids: string[]) => {
    try {
      setUpdatingOrder(true);
      const items = uuids.map((uuid, index) => ({
        uuid,
        orden: index + 1,
      }));

      const response = await ofertasDestacadasEndpoints.reorder({ items });

      if (response.success) {
        await fetchOfertas();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error al actualizar orden:", err);
      return false;
    } finally {
      setUpdatingOrder(false);
    }
  };

  const refetch = fetchOfertas;

  return {
    ofertas,
    loading,
    error,
    toggleOfertaActive,
    deleteOferta,
    updateOfertasOrder,
    updatingOferta,
    deletingOferta,
    updatingOrder,
    refetch,
  };
}
