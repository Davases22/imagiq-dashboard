"use client";

import { useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { productEndpoints } from "@/lib/api";
import Image from "next/image";

interface Product {
  codigoMarketBase: string;
  nombreMarket: string | string[];
  urlImagenes?: string[];
  imagePreviewUrl?: string[];
  imageDetailsUrls?: string[][];
  imagen_final_premium?: (string | null)[];
  imagen_premium?: string[][];
}

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (productoId: string, productoNombre: string) => Promise<void>;
}

export function AddProductDialog({
  open,
  onClose,
  onAdd,
}: AddProductDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await productEndpoints.search(searchQuery);
      // ProductApiResponse: { data: ProductPaginationData, ... }
      if (
        response.success &&
        response.data &&
        Array.isArray((response.data as any).products)
      ) {
        setProducts((response.data as any).products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error buscando productos:", error);
      setProducts([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddProduct = async (
    productoId: string,
    productoNombre: string
  ) => {
    setAdding(productoId);
    try {
      await onAdd(productoId, productoNombre);
      // Limpiar búsqueda y cerrar
      setSearchQuery("");
      setProducts([]);
      onClose();
    } catch (error) {
      console.error("Error agregando producto:", error);
    } finally {
      setAdding(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setProducts([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Producto a Ofertas</DialogTitle>
          <DialogDescription>
            Busca y selecciona un producto para agregarlo al dropdown de ofertas
            destacadas
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              "Buscar"
            )}
          </Button>
        </div>

        {/* Resultados */}
        <ScrollArea className="h-[400px] border rounded-md">
          {products.length === 0 && !searching && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {searchQuery
                ? "No se encontraron productos"
                : "Busca un producto para comenzar"}
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="p-4 space-y-2">
            {products.map((product) => {
              const nombre = Array.isArray(product.nombreMarket)
                ? product.nombreMarket[0]
                : product.nombreMarket;
              // Buscar imagen en varios campos posibles
              const imagen =
                (product.imagen_final_premium &&
                  product.imagen_final_premium[0]) ||
                (product.imagen_premium && product.imagen_premium[0]?.[0]) ||
                (product.imagePreviewUrl && product.imagePreviewUrl[0]) ||
                (product.urlImagenes && product.urlImagenes[0]) ||
                (product.imageDetailsUrls &&
                  product.imageDetailsUrls[0]?.[0]) ||
                null;
              const productId = product.codigoMarketBase;

              return (
                <div
                  key={product.codigoMarketBase}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  {/* Imagen del producto */}
                  <div className="relative w-16 h-16 bg-gray-100 rounded shrink-0">
                    {imagen ? (
                      <Image
                        src={imagen}
                        alt={nombre}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Nombre del producto */}
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-2">{nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {product.codigoMarketBase}
                    </p>
                  </div>

                  {/* Botón agregar */}
                  <Button
                    size="sm"
                    onClick={() => handleAddProduct(productId, nombre)}
                    disabled={adding !== null}
                  >
                    {adding === productId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" />
                        Agregar
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
