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
  const [updatingNombre, setUpdatingNombre] = useState<string | null>(null);

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

      // El backend puede devolver 400 con "no elements in sequence" (EmptyError de RxJS)
      // cuando elimina correctamente pero intenta devolver el elemento que ya no existe
      // Verificar si el error es este caso específico
      const errorMessage = response.message || "";
      const responseData = response.data as any;
      const isEmptyError = 
        errorMessage.includes("no elements in sequence") ||
        errorMessage.includes("EmptyError") ||
        (responseData && 
         responseData.message && 
         typeof responseData.message === 'object' &&
         responseData.message.message &&
         String(responseData.message.message).includes("no elements in sequence"));

      // Considerar éxito si:
      // 1. response.success es true
      // 2. El error es "no elements in sequence" (el backend eliminó correctamente pero falló al devolver)
      if (response.success || isEmptyError) {
        // Refrescar la lista
        await fetchOfertas();
        toast.success("Oferta eliminada correctamente");
        return true;
      }

      // Si la API responde con success false y no es el caso especial, mostrar mensaje
      if (response && response.message && !isEmptyError) {
        toast.error(`No se pudo eliminar la oferta: ${response.message}`);
      } else if (!isEmptyError) {
        toast.error("No se pudo eliminar la oferta (error desconocido)");
      }
      return false;
    } catch (err: any) {
      // Manejo de errores HTTP específicos
      const errorStr = err ? JSON.stringify(err) : "";
      const isSequenceError = errorStr.includes("no elements in sequence") || 
                             errorStr.includes("EmptyError");

      if (err && err.message) {
        if (err.message.includes("404") || isSequenceError) {
          // 404 o EmptyError pueden significar que ya fue eliminada - tratar como éxito
          await fetchOfertas();
          toast.success("Oferta eliminada correctamente");
          return true;
        } else if (err.message.includes("400")) {
          // Verificar si es el error de "no elements in sequence"
          if (isSequenceError) {
            await fetchOfertas();
            toast.success("Oferta eliminada correctamente");
            return true;
          }
          toast.error("Solicitud incorrecta al eliminar la oferta (400)");
        } else {
          toast.error(`Error al eliminar oferta: ${err.message}`);
        }
      } else if (isSequenceError) {
        // Si es EmptyError aunque no tenga message, tratar como éxito
        await fetchOfertas();
        toast.success("Oferta eliminada correctamente");
        return true;
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

      const response = await ofertasDestacadasEndpoints.reorder(items);

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

  const updateNombre = async (uuid: string, tipoNombre: "market" | "modelo") => {
    try {
      setUpdatingNombre(uuid);
      const response = await ofertasDestacadasEndpoints.updateNombre(uuid, tipoNombre);

      if (response.success) {
        await fetchOfertas();
        toast.success(response.message || "Nombre actualizado correctamente");
        return true;
      } else {
        const errorMsg = response.message || "Error al actualizar el nombre";
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      console.error("Error al actualizar nombre:", err);
      const errorMsg = err?.message || "Error desconocido al actualizar el nombre";
      
      // Manejar errores específicos
      if (errorMsg.includes("422") || errorMsg.includes("no tiene modelo")) {
        toast.error("El producto no tiene modelo disponible");
      } else if (errorMsg.includes("404")) {
        toast.error("La oferta destacada no existe");
      } else {
        toast.error(errorMsg);
      }
      return false;
    } finally {
      setUpdatingNombre(null);
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
    updateNombre,
    updatingOferta,
    deletingOferta,
    updatingOrder,
    updatingNombre,
    refetch,
  };
}
