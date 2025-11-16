import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/products/[id]/media/detail
 * Elimina una o varias imágenes de detalle de un producto específico
 *
 * @param id - codigoMarketBase del producto
 * @param request - Request body con el SKU del color y los números de las imágenes a eliminar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: codigoMarketBase } = await params;
    const body = await request.json();
    const { sku, numeros } = body;

    // Validación básica
    if (!sku) {
      return NextResponse.json(
        {
          success: false,
          message: "SKU es requerido",
        },
        { status: 400 }
      );
    }

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Los números de las imágenes a eliminar son requeridos",
        },
        { status: 400 }
      );
    }

    // Aquí se haría la petición al microservicio de productos
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    const backendUrl = `${API_BASE_URL}/api/multimedia/producto/${sku}/imagenes-detalle`;

    // Reenviar la petición DELETE al backend
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
      body: JSON.stringify({ numeros }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Error al eliminar imágenes de detalle",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Imágenes de detalle eliminadas correctamente (${numeros.length} imagen/es)`,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

