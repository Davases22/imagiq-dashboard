import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/products/[id]/media
 * Actualiza las imágenes, videos y archivos AR de un producto específico
 *
 * @param id - codigoMarketBase del producto
 * @param formData - Datos multimedia (imágenes preview, detalles, videos, archivos AR)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: codigoMarketBase } = await params;
    const formData = await request.formData();

    const sku = formData.get("sku") as string;
    const codigoMarket = formData.get("codigoMarket") as string;

    // Validación básica
    if (!sku || !codigoMarket) {
      return NextResponse.json(
        {
          success: false,
          message: "SKU y código market son requeridos",
        },
        { status: 400 }
      );
    }

    // Aquí se haría la petición al microservicio de productos
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    const backendUrl = `${API_BASE_URL}/api/products/${codigoMarketBase}/media`;

    // Reenviar el FormData completo al backend
    const response = await fetch(backendUrl, {
      method: "PUT",
      body: formData, // Enviar FormData directamente
      headers: {
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Error al actualizar multimedia",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Multimedia actualizada correctamente",
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
