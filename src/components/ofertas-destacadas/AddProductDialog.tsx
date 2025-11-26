"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 10;

  // Cargar productos automáticamente cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadProducts(1, "");
    } else {
      // Limpiar estado al cerrar
      setSearchQuery("");
      setProducts([]);
      setCurrentPage(1);
    }
  }, [open]);

  const loadProducts = async (page: number, query: string) => {
    setSearching(true);
    try {
      const params: any = {
        limit: pageSize,
        page: page,
      };

      if (query.trim()) {
        params.query = query;
      }

      const response = await productEndpoints.getFilteredSearch(params);

      // Usar la misma lógica que useProducts.ts
      if (response.success && response.data && response.data.data) {
        const paginationData = response.data.data;

        if (paginationData && Array.isArray(paginationData.products)) {
          setProducts(paginationData.products);
          setTotalProducts(paginationData.total || 0);
          setTotalPages(paginationData.totalPages || 1);
          setCurrentPage(paginationData.page || page);
        } else {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
        }
      } else {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    loadProducts(1, searchQuery);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadProducts(currentPage - 1, searchQuery);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadProducts(currentPage + 1, searchQuery);
    }
  };

  const handleAddProduct = async (
    productoId: string,
    productoNombre: string
  ) => {
    setAdding(productoId);
    try {
      await onAdd(productoId, productoNombre);
      // No cerrar el diálogo para permitir agregar más productos
    } catch (error) {
      console.error("Error agregando producto:", error);
    } finally {
      setAdding(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setProducts([]);
    setCurrentPage(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Producto a Ofertas</DialogTitle>
          <DialogDescription>
            Selecciona uno o más productos para agregarlos al dropdown de ofertas destacadas (máximo 10)
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre o navega con los botones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching}>
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
              No se encontraron productos
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

        {/* Paginación estilo tabla de productos */}
        {!searching && products.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Filas por página
              </span>
              <span className="text-sm font-medium">{pageSize}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => loadProducts(1, searchQuery)}
                  disabled={currentPage === 1}
                >
                  <span className="text-sm">«</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => loadProducts(totalPages, searchQuery)}
                  disabled={currentPage === totalPages}
                >
                  <span className="text-sm">»</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
