import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  productosHomeEndpoints,
  ProductoHome,
  SeccionHome,
  SECCIONES_HOME,
} from "@/lib/api";

/** Cuántas tarjetas pinta cada franja de la home. Pasado ese número, los
 *  extras no se ven, así que avisamos antes de dejar agregar más. */
export const CUPOS_POR_SECCION = 4;

type PorSeccion = Record<SeccionHome, ProductoHome[]>;

const vacio = (): PorSeccion =>
  SECCIONES_HOME.reduce(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as PorSeccion
  );

export function useProductosHome() {
  const [porSeccion, setPorSeccion] = useState<PorSeccion>(vacio);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productosHomeEndpoints.getAll();
      // El gateway devuelve { success, data } y el ApiClient lo vuelve a
      // envolver, igual que en ofertas destacadas.
      const filas = ((response.data as { data?: ProductoHome[] })?.data ??
        response.data) as ProductoHome[] | undefined;

      if (!Array.isArray(filas)) {
        setError("No se pudieron cargar los productos de la home");
        return;
      }

      const agrupado = vacio();
      for (const fila of filas) {
        if (agrupado[fila.seccion]) agrupado[fila.seccion].push(fila);
      }
      for (const s of SECCIONES_HOME) {
        agrupado[s].sort((a, b) => a.orden - b.orden);
      }

      setPorSeccion(agrupado);
      setError(null);
    } catch (err) {
      console.error("Error al cargar productos de la home:", err);
      setError("Error al cargar los productos de la home");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const agregar = useCallback(
    async (seccion: SeccionHome, codigoMarket: string, nombre: string) => {
      if (porSeccion[seccion].some((p) => p.codigo_market === codigoMarket)) {
        toast.error("Ese producto ya está en esta sección");
        return false;
      }

      try {
        setGuardando(codigoMarket);
        await productosHomeEndpoints.create({
          codigo_market: codigoMarket,
          seccion,
          nombre,
        });
        toast.success(`${nombre} agregado`);
        await cargar();
        return true;
      } catch (err) {
        console.error("Error al agregar producto a la home:", err);
        toast.error("No se pudo agregar el producto");
        return false;
      } finally {
        setGuardando(null);
      }
    },
    [porSeccion, cargar]
  );

  const alternarActivo = useCallback(
    async (producto: ProductoHome) => {
      try {
        setGuardando(producto.uuid);
        await productosHomeEndpoints.update(producto.uuid, {
          activo: !producto.activo,
        });
        await cargar();
        return true;
      } catch (err) {
        console.error("Error al cambiar el estado:", err);
        toast.error("No se pudo cambiar el estado");
        return false;
      } finally {
        setGuardando(null);
      }
    },
    [cargar]
  );

  const eliminar = useCallback(
    async (producto: ProductoHome) => {
      try {
        setGuardando(producto.uuid);
        await productosHomeEndpoints.delete(producto.uuid);
        toast.success("Producto quitado de la home");
        await cargar();
        return true;
      } catch (err) {
        console.error("Error al quitar producto:", err);
        toast.error("No se pudo quitar el producto");
        return false;
      } finally {
        setGuardando(null);
      }
    },
    [cargar]
  );

  /** Mueve un producto una posición arriba o abajo dentro de su sección. */
  const mover = useCallback(
    async (seccion: SeccionHome, uuid: string, direccion: -1 | 1) => {
      const lista = [...porSeccion[seccion]];
      const i = lista.findIndex((p) => p.uuid === uuid);
      const destino = i + direccion;
      if (i === -1 || destino < 0 || destino >= lista.length) return false;

      [lista[i], lista[destino]] = [lista[destino], lista[i]];

      // Optimista: la lista se reacomoda de una para que el clic se sienta
      // inmediato; si el backend falla, cargar() la devuelve a su estado real.
      setPorSeccion((prev) => ({ ...prev, [seccion]: lista }));

      try {
        setGuardando(uuid);
        await productosHomeEndpoints.reorder(
          lista.map((p, idx) => ({ uuid: p.uuid, orden: idx + 1 }))
        );
        await cargar();
        return true;
      } catch (err) {
        console.error("Error al reordenar:", err);
        toast.error("No se pudo guardar el nuevo orden");
        await cargar();
        return false;
      } finally {
        setGuardando(null);
      }
    },
    [porSeccion, cargar]
  );

  return {
    porSeccion,
    loading,
    error,
    guardando,
    recargar: cargar,
    agregar,
    alternarActivo,
    eliminar,
    mover,
  };
}
