"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddProductDialog } from "@/components/ofertas-destacadas/AddProductDialog";
import { PreviewFranja } from "@/components/productos-home/PreviewFranja";
import {
  CUPOS_POR_SECCION,
  useProductosHome,
} from "@/hooks/useProductosHome";
import {
  ETIQUETAS_SECCION_HOME,
  SECCIONES_HOME,
  SeccionHome,
} from "@/lib/api";

/**
 * Categoría del catálogo que corresponde a cada franja. Sirve para que el
 * buscador ofrezca solo productos que tienen sentido ahí — y de paso evita que
 * la primera página salga vacía: sin filtro, el catálogo arranca con cientos de
 * repuestos que el diálogo descarta.
 */
const CATEGORIA_POR_SECCION: Record<SeccionHome, string> = {
  celulares: "IM",
  tv: "AV",
  electro: "DA",
};

export default function ProductosHomePage() {
  const {
    porSeccion,
    loading,
    error,
    guardando,
    agregar,
    alternarActivo,
    eliminar,
    mover,
  } = useProductosHome();

  const [seccionActiva, setSeccionActiva] = useState<SeccionHome>("celulares");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const lista = porSeccion[seccionActiva] ?? [];
  const activos = lista.filter((p) => p.activo).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Productos de la Home</h1>
        <p className="text-muted-foreground">
          Elige qué productos aparecen en cada franja de la página de inicio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secciones</CardTitle>
          <CardDescription>
            Cada franja muestra {CUPOS_POR_SECCION} productos, agotados
            incluidos. Si fijas menos, la web completa el resto con los de la
            categoría, igual que antes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={seccionActiva}
            onValueChange={(v) => setSeccionActiva(v as SeccionHome)}
          >
            <TabsList className="mb-4">
              {SECCIONES_HOME.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {ETIQUETAS_SECCION_HOME[s]}
                  <Badge variant="secondary" className="ml-2">
                    {(porSeccion[s] ?? []).filter((p) => p.activo).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {SECCIONES_HOME.map((s) => (
              <TabsContent key={s} value={s} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {activos} visible{activos === 1 ? "" : "s"} de{" "}
                    {CUPOS_POR_SECCION} cupos
                    {activos > CUPOS_POR_SECCION && (
                      <span className="ml-2 text-amber-600">
                        · los que sobran no se verán
                      </span>
                    )}
                  </p>
                  <Button size="sm" onClick={() => setDialogoAbierto(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar producto
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando…
                  </div>
                ) : error ? (
                  <p className="py-10 text-center text-destructive">{error}</p>
                ) : lista.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">
                    Sin productos fijados. La franja se llena sola con los de la
                    categoría.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Orden</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-40">Código</TableHead>
                        <TableHead className="w-28">Visible</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.map((p, i) => (
                        <TableRow
                          key={p.uuid}
                          className={p.activo ? "" : "opacity-50"}
                        >
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={i === 0 || guardando !== null}
                                onClick={() => void mover(s, p.uuid, -1)}
                                aria-label="Subir"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={
                                  i === lista.length - 1 || guardando !== null
                                }
                                onClick={() => void mover(s, p.uuid, 1)}
                                aria-label="Bajar"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {p.nombre || "—"}
                            {i >= CUPOS_POR_SECCION && p.activo && (
                              <Badge variant="outline" className="ml-2">
                                fuera de cupo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.codigo_market}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={p.activo}
                              disabled={guardando !== null}
                              onCheckedChange={() => void alternarActivo(p)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              disabled={guardando !== null}
                              onClick={() => void eliminar(p)}
                              aria-label="Quitar de la home"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Así se verá en la home</CardTitle>
          <CardDescription>
            Los datos salen del catálogo, igual que en la web. Un producto
            fijado se muestra aunque esté agotado: la ficha ofrecerá avisar
            cuando vuelva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreviewFranja
            codigos={lista.filter((p) => p.activo).map((p) => p.codigo_market)}
            cupos={CUPOS_POR_SECCION}
          />
        </CardContent>
      </Card>

      {/* Se reusa el buscador de ofertas destacadas: entrega el
          codigoMarketBase, que es justo lo que guarda productos_home. */}
      <AddProductDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        title={`Agregar producto a ${ETIQUETAS_SECCION_HOME[seccionActiva]}`}
        description="Busca el producto que quieres mostrar en esta franja de la home."
        categoria={CATEGORIA_POR_SECCION[seccionActiva]}
        excludeIds={lista.map((p) => p.codigo_market)}
        ofertasExistentes={lista.map((p) => ({
          codigo_market: p.codigo_market,
        }))}
        onAdd={async (codigoMarket, nombre) => {
          await agregar(seccionActiva, codigoMarket, nombre);
        }}
      />
    </div>
  );
}
