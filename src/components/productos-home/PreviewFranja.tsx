"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Loader2 } from "lucide-react";

import { productEndpoints } from "@/lib/api";

/** Una variante comprable, tal como la ofrece la tarjeta de la web. */
interface Variante {
  etiqueta: string;
  /** El nombre y el SKU cambian con la variante, igual que en la tarjeta real. */
  nombre: string | null;
  sku: string | null;
  precio: number | null;
  precioAntes: number | null;
  stock: number;
}

interface DatosTarjeta {
  codigo: string;
  nombre: string;
  sku: string | null;
  imagen: string | null;
  variantes: Variante[];
  /** Variante que la web trae seleccionada: la primera con inventario. */
  inicial: number;
  agotado: boolean;
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
 * Vista previa de una franja de la home, con la misma tarjeta que ve el
 * comprador: imagen, selector de variante, precio con su tachado y el ahorro.
 *
 * Los datos se leen del catálogo por codigo_market, igual que hace la web: la
 * tabla productos_home guarda solo la curaduría, así que pintar un nombre o un
 * precio guardado podría mentir justo cuando más importa.
 */
export function PreviewFranja({ codigos, cupos }: Props) {
  const [tarjetas, setTarjetas] = useState<DatosTarjeta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [elegida, setElegida] = useState<Record<string, number>>({});

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
            const sinDatos: DatosTarjeta = {
              codigo,
              nombre: codigo,
              sku: null,
              imagen: null,
              variantes: [],
              inicial: 0,
              agotado: true,
              noEncontrado: true,
            };

            try {
              const r = await productEndpoints.getByCodigoMarket(codigo);
              const p = primero(r.data?.products ?? []);
              if (!p) return sinDatos;

              const capacidades = p.capacidad ?? [];
              const modelos = p.modelo ?? [];
              const skus = p.sku ?? [];
              const precios = p.precioeccommerce ?? [];
              const normales = p.precioNormal ?? [];
              const stocks = p.stockTotal ?? [];
              // La web no pinta las variantes ocultas en producción — es
              // justamente lo que deja fuera las filas con precio centinela
              // de 99.999.999 que trae duplicadas el catálogo.
              const visibles = p.visibleProduction ?? [];

              const variantes: Variante[] = [];
              const vistas = new Set<string>();

              for (let i = 0; i < capacidades.length; i++) {
                if (visibles.length > 0 && visibles[i] === false) continue;

                const etiqueta = capacidades[i] || `Opción ${i + 1}`;
                if (vistas.has(etiqueta)) continue;
                vistas.add(etiqueta);

                variantes.push({
                  etiqueta,
                  nombre: Array.isArray(modelos) ? (modelos[i] ?? null) : null,
                  sku: skus[i] ?? null,
                  precio: precios[i] ?? null,
                  precioAntes: normales[i] ?? null,
                  stock: stocks[i] ?? 0,
                });
              }

              // La web abre en la primera variante CON inventario, no en la
              // primera de la lista: por eso un TV cuyo tamaño menor está
              // agotado aparece con el siguiente ya seleccionado.
              const conStock = variantes.findIndex((x) => x.stock > 0);

              return {
                codigo,
                nombre: texto(p.modelo) ?? texto(p.nombreMarket) ?? codigo,
                sku: texto(p.sku),
                imagen: primero(p.imagePreviewUrl ?? []),
                variantes,
                inicial: conStock >= 0 ? conStock : 0,
                agotado: !stocks.some((s) => s > 0),
              };
            } catch {
              return sinDatos;
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((t) => {
        const idx = elegida[t.codigo] ?? t.inicial;
        const v = t.variantes[idx];
        const ahorro =
          v?.precio && v?.precioAntes && v.precioAntes > v.precio
            ? v.precioAntes - v.precio
            : null;

        return (
          <div key={t.codigo} className="space-y-3">
            {/* Lienzo de la imagen: gris claro y esquinas redondeadas, como en la web */}
            <div className="relative flex h-44 items-center justify-center rounded-xl bg-[#f5f5f5]">
              <Heart className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
              {t.imagen ? (
                <Image
                  src={t.imagen}
                  alt={t.nombre}
                  fill
                  className="object-contain p-6"
                  sizes="260px"
                />
              ) : (
                <span className="text-xs text-neutral-400">Sin imagen</span>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-neutral-600 shadow-sm">
                Paga con addi
              </span>
            </div>

            <div className="space-y-2">
              <p className="line-clamp-2 text-sm font-semibold leading-tight">
                {v?.nombre ?? t.nombre}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                SKU: {v?.sku ?? t.sku ?? t.codigo}
              </p>

              {t.noEncontrado ? (
                <p className="text-xs text-destructive">
                  No está en el catálogo
                </p>
              ) : (
                <>
                  {t.variantes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.variantes.map((opt, i) => (
                        <button
                          key={opt.etiqueta}
                          type="button"
                          onClick={() =>
                            setElegida((prev) => ({ ...prev, [t.codigo]: i }))
                          }
                          className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                            i === idx
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground/40"
                          }`}
                        >
                          {opt.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-bold">
                      {v?.precio ? formatearCOP(v.precio) : "—"}
                    </span>
                    {ahorro && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatearCOP(v!.precioAntes!)}
                      </span>
                    )}
                  </div>
                  {ahorro && (
                    <p className="text-xs text-blue-500">
                      Ahorra {formatearCOP(ahorro)}
                    </p>
                  )}

                  {/* Informativo, no bloquea: un producto fijado se muestra en
                      la home aunque esté agotado; la ficha ofrecerá avisar
                      cuando vuelva. */}
                  {(t.agotado || v?.stock === 0) && (
                    <p className="text-xs text-amber-600">
                      {t.agotado
                        ? "Agotado en todas las variantes"
                        : "Esta variante está agotada"}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background">
                      {t.agotado ? "Notificarme" : "Añadir al carrito"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Más información
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
