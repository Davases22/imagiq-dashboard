import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Oferta {
  id: string
  titulo: string
  descripcion?: string
  descuento: number
  tipoDescuento: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  isActive: boolean
  categorias?: string[]
  productos?: string[]
  createdAt: string
  updatedAt: string
}

export function useOfertas() {
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [loading, setLoading] = useState(true)

  const loadOfertas = async () => {
    setLoading(true)
    try {
      // TODO: Reemplazar con llamada a API real
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ofertas`)
      // const data = await response.json()
      // setOfertas(data)

      // Datos de ejemplo (mock)
      setOfertas([
        {
          id: "1",
          titulo: "Black Friday 2024",
          descripcion: "Descuentos especiales en toda la tienda",
          descuento: 30,
          tipoDescuento: "porcentaje",
          fechaInicio: "2024-11-25",
          fechaFin: "2024-11-30",
          isActive: true,
          categorias: ["cat-1", "cat-2"],
          createdAt: "2024-11-01",
          updatedAt: "2024-11-01",
        },
        {
          id: "2",
          titulo: "Cyber Monday",
          descripcion: "Ofertas exclusivas online",
          descuento: 500,
          tipoDescuento: "monto",
          fechaInicio: "2024-12-01",
          fechaFin: "2024-12-05",
          isActive: false,
          productos: ["prod-1", "prod-2"],
          createdAt: "2024-11-10",
          updatedAt: "2024-11-10",
        },
      ])
    } catch (error) {
      console.error("Error loading ofertas:", error)
      toast.error("Error al cargar las ofertas")
    } finally {
      setLoading(false)
    }
  }

  const toggleOfertaActive = async (oferta: Oferta) => {
    try {
      // TODO: Implementar llamada a API
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ofertas/${oferta.id}/activo`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ isActive: !oferta.isActive })
      // })

      setOfertas(prev =>
        prev.map(o => (o.id === oferta.id ? { ...o, isActive: !o.isActive } : o))
      )
      toast.success(`Oferta ${!oferta.isActive ? "activada" : "desactivada"} exitosamente`)
    } catch (error) {
      console.error("Error toggling oferta:", error)
      toast.error("Error al actualizar el estado de la oferta")
    }
  }

  const deleteOferta = async (ofertaId: string) => {
    try {
      // TODO: Implementar llamada a API
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ofertas/${ofertaId}`, {
      //   method: 'DELETE'
      // })

      setOfertas(prev => prev.filter(o => o.id !== ofertaId))
      toast.success("Oferta eliminada exitosamente")
    } catch (error) {
      console.error("Error deleting oferta:", error)
      toast.error("Error al eliminar la oferta")
    }
  }

  useEffect(() => {
    loadOfertas()
  }, [])

  return {
    ofertas,
    loading,
    toggleOfertaActive,
    deleteOferta,
    refreshOfertas: loadOfertas,
  }
}
