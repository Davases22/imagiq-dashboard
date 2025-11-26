import { toast } from "sonner";

import { useState, useEffect } from "react";
import {
  ofertasDestacadasEndpoints,
  OfertaDestacada,
  productEndpoints,
} from "@/lib/api";

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

      if (response.success && response.data) {
        // Enriquecer con datos de producto
        const ofertasConProducto = await Promise.all(
          response.data.map(async (oferta) => {
            try {
              // Usar getByCodigoMarket en lugar de getById
              const productResponse = await productEndpoints.getByCodigoMarket(
                oferta.producto_id
              );

              if (productResponse.success && productResponse.data?.products) {
                const product = productResponse.data.products[0];
                if (product) {
                  const nombreMarket = Array.isArray(product.nombreMarket)
                    ? product.nombreMarket[0]
                    : product.nombreMarket;
                  // Buscar imagen en los mismos campos que el frontend
                  const imagen =
                    (product.imagen_final_premium &&
                      product.imagen_final_premium[0]) ||
                    (product.imagen_premium &&
                      product.imagen_premium[0]?.[0]) ||
                    (product.imagePreviewUrl && product.imagePreviewUrl[0]) ||
                    (product.urlImagenes && product.urlImagenes[0]) ||
                    (product.imageDetailsUrls &&
                      product.imageDetailsUrls[0]?.[0]) ||
                    "";
                  const sku = product.sku?.[0] || "";
                  const link = sku
                    ? `/productos/${product.categoria}/${product.menu}/${sku}`
                    : "";

                  return {
                    ...oferta,
                    producto_nombre: nombreMarket,
                    producto_imagen: imagen,
                    link_url: link,
                  };
                }
              }
            } catch (err) {
              console.error(
                `Error al obtener producto ${oferta.producto_id}:`,
                err
              );
            }
            return oferta;
          })
        );

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
