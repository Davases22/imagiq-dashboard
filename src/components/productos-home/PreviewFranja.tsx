"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { productEndpoints } from "@/lib/api";

/** Lo mínimo para pintar una tarjeta como la de la home. */
interface DatosTarjeta {
  codigo: string;
  nombre: string;
  imagen: string | null;
  precioDesde: number | null;
  sinStock: boolean;
  noEncontrado?: boolean;
}

interface Props {
  /** codigo_market de los productos activos, en el orden configurado. */
  codigos: string[];
  /** Cuántas tarjetas pinta realmente la home. */
  cupos: number;
}

const primero = <T,>(v: T[] | null | undefined): T | null =>
  Array.isArray(v) && v.length > 0 ? v[0] : null;

/** El catálogo devuelve estos campos como string o como array de strings. */
const texto = (v: string | string[] | null | undefined): string | null => {
  const x = Array.isArray(v) ? v[0] : v;
  return x && x.trim() ? x : null;
};

const formatearCOP = (v: number) =>
  `$ ${Math.round(v).toLocaleString("es-CO")}`;

/**
 * Vista previa de una franja de la home.
 *
 * Los datos se leen del catálogo por codigo_market, igual que hará la web: la
 * tabla productos_home guarda solo la curaduría, así que si aquí mostráramos
 * un nombre o precio guardado, la previsualización podría mentir.
 */
export function PreviewFranja({ codigos, cupos }: Props) {
  const [tarjetas, setTarjetas] = useState<DatosTarjeta[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      if (codigos.length === 0) {
        setTarjetas([]);
        return;
      }

      setCargando(true);
      try {
        const resultados = await Promise.all(
          codigos.slice(0, cupos).map(async (codigo): Promise<DatosTarjeta> => {
            try {
              const r = await productEndpoints.getByCodigoMarket(codigo);
              const p = primero(r.data?.products ?? []);
              if (!p) {
                return {
                  codigo,
                  nombre: codigo,
                  imagen: null,
                  precioDesde: null,
                  sinStock: true,
                  noEncontrado: true,
                };
              }

              const precios = p.precioDescto ?? p.precioNormal ?? [];
              // Se descartan los precios centinela del catálogo: hay filas
              // duplicadas con 99.999.999 que no representan nada vendible.
              const validos = precios.filter(
                (x) => typeof x === "number" && x > 0 && x < 50_000_000
              );
              const stock = p.stockTotal ?? [];

              return {
                codigo,
                nombre:
                  texto(p.modelo) ?? texto(p.nombreMarket) ?? codigo,
                imagen: primero(p.imagePreviewUrl ?? []),
                precioDesde: validos.length ? Math.min(...validos) : null,
                sinStock: !stock.some((s) => s > 0),
              };
            } catch {
              return {
                codigo,
                nombre: codigo,
                imagen: null,
                precioDesde: null,
                sinStock: true,
                noEncontrado: true,
              };
            }
          })
        );

        if (vigente) setTarjetas(resultados);
      } finally {
        if (vigente) setCargando(false);
      }
    };

    void cargar();
    return () => {
      vigente = false;
    };
  }, [codigos, cupos]);

  if (codigos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sin productos fijados: la franja se llena sola con los de la categoría.
      </p>
    );
  }

  if (cargando && tarjetas.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando vista previa…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <div
          key={t.codigo}
          className="overflow-hidden rounded-lg border bg-background"
        >
          <div className="relative flex h-32 items-center justify-center bg-muted">
            {t.imagen ? (
              <Image
                src={t.imagen}
                alt={t.nombre}
                fill
                className="object-contain p-3"
                sizes="200px"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Sin imagen</span>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="line-clamp-2 text-xs font-medium">{t.nombre}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {t.codigo}
            </p>
            {t.noEncontrado ? (
              <p className="text-xs text-destructive">
                No está en el catálogo
              </p>
            ) : t.sinStock ? (
              // Mismo criterio que la web: sin inventario no se pinta, así que
              // conviene verlo aquí antes de que la franja quede coja.
              <p className="text-xs text-amber-600">
                Agotado · no se verá en la home
              </p>
            ) : (
              <p className="text-sm font-semibold">
                {t.precioDesde ? formatearCOP(t.precioDesde) : "—"}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
