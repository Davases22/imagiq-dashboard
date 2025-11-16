"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { MapPin, Search, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import type { ResultadoCobertura } from "@/lib/api/coverage-zones"
import { getApiKey } from "@/lib/api-client"
import { toast } from "sonner"

interface CoverageCheckerProps {
  ciudad: string
  onCheckCoverage: (lat: number, lon: number) => Promise<ResultadoCobertura | null>
}

interface PlacePrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

// Usar la misma configuración que el resto de la aplicación
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
// Asegurar que la URL tenga /api si no lo tiene
const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`

export function CoverageChecker({ ciudad, onCheckCoverage }: CoverageCheckerProps) {
  const [address, setAddress] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<ResultadoCobertura | null>(null)
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [sessionToken] = useState(() => crypto.randomUUID())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Buscar predicciones de direcciones usando Google Places API
  // FORZAR que solo se muestren sugerencias de la API, no del navegador
  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    try {
      const params = new URLSearchParams({
        input: input.trim(),
        country: "CO",
        location: "4.570868,-74.297333", // Bogotá como referencia
        radius: "1000000",
        language: "es",
        sessionToken,
        types: "address",
      })

      const apiKey = getApiKey();
      const response = await fetch(`${baseUrl}/places/autocomplete?${params}`, {
        headers: {
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = "Error al buscar direcciones"
        let errorDetails: any = null

        try {
          errorDetails = await response.json().catch(() => null)
          if (errorDetails?.message) {
            errorMessage = errorDetails.message
          } else if (errorDetails?.error) {
            errorMessage = errorDetails.error
          }
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        // Log detallado del error para debugging
        console.error("Error al buscar direcciones:", {
          status: response.status,
          statusText: response.statusText,
          url: `${baseUrl}/places/autocomplete`,
          errorDetails,
          input: input.trim(),
        })

        // Mostrar mensaje de error más específico
        const finalErrorMessage = 
          response.status === 404
            ? "El servicio de búsqueda de direcciones no está disponible"
            : response.status === 500
            ? "Error en el servidor al buscar direcciones"
            : response.status === 400
            ? "Solicitud inválida. Por favor, verifica la dirección"
            : errorMessage

        // Solo mostrar toast para errores críticos, no para errores de red menores
        if (response.status >= 500) {
          toast.error(finalErrorMessage)
        }

        // Limpiar predicciones y retornar sin lanzar error
        // El error ya fue loggeado con detalles arriba
        setPredictions([])
        setShowPredictions(false)
        return
      }

      const data = await response.json()

      // Solo mostrar si hay predicciones válidas de la API
      if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        setPredictions(data.predictions)
        setShowPredictions(true)
      } else {
        // Forzar limpieza si no hay predicciones
        setPredictions([])
        setShowPredictions(false)
      }
    } catch (error) {
      // Manejar errores de red u otros errores no relacionados con HTTP
      console.error("Error searching places (network/other):", error)
      
      // Solo mostrar toast para errores de red
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
          // No mostrar toast para errores de red en búsquedas automáticas
          // Solo limpiar predicciones silenciosamente
        }
      }
      
      // Forzar limpieza en caso de error
      setPredictions([])
      setShowPredictions(false)
    }
  }

  // Obtener detalles de un lugar y sus coordenadas
  const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const params = new URLSearchParams({
        placeId,
        sessionToken,
        language: "es",
      })

      const apiKey = getApiKey();
      const response = await fetch(`${baseUrl}/places/details?${params}`, {
        headers: {
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = "Error al obtener detalles del lugar"
        let errorDetails: any = null

        try {
          errorDetails = await response.json().catch(() => null)
          if (errorDetails?.message) {
            errorMessage = errorDetails.message
          } else if (errorDetails?.error) {
            errorMessage = errorDetails.error
          }
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        // Log detallado del error para debugging
        console.error("Error al obtener detalles del lugar:", {
          status: response.status,
          statusText: response.statusText,
          url: `${baseUrl}/places/details`,
          errorDetails,
          placeId,
        })

        // Mostrar mensaje de error más específico
        const finalErrorMessage = 
          response.status === 404
            ? "No se encontraron detalles para esta dirección"
            : response.status === 500
            ? "Error en el servidor al obtener detalles"
            : response.status === 400
            ? "Solicitud inválida"
            : errorMessage

        toast.error(finalErrorMessage)
        // Retornar null en lugar de lanzar error para evitar mostrar toast duplicado
        return null
      }

      const data = await response.json()

      if (data.place && data.place.latitude && data.place.longitude) {
        return {
          lat: data.place.latitude,
          lon: data.place.longitude,
        }
      }

      return null
    } catch (error) {
      // Log detallado del error
      console.error("Error getting place details:", error)
      
      // Solo mostrar toast para errores de red u otros errores no manejados
      // Los errores HTTP ya fueron manejados arriba y retornaron null
      if (error instanceof Error) {
        // Si es un error de red, mostrar toast
        if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
          toast.error("Error de conexión. Por favor, verifica tu conexión a internet")
        } else if (!error.message.includes("Error al obtener detalles")) {
          // Solo mostrar toast si no es un error que ya fue manejado
          toast.error("Error al obtener detalles de la dirección")
        }
      } else {
        toast.error("Error al obtener detalles de la dirección")
      }
      return null
    }
  }

  // Ocultar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Debounce para búsqueda - FORZAR que solo se muestren sugerencias de la API
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // NO buscar si se está verificando una dirección
    if (isChecking) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    if (address.trim().length >= 3) {
      // Limpiar predicciones anteriores antes de buscar nuevas
      setPredictions([])
      setShowPredictions(false)
      
      debounceTimerRef.current = setTimeout(() => {
        searchPlaces(address.trim())
      }, 300)
    } else {
      // Forzar limpieza si hay menos de 3 caracteres
      setPredictions([])
      setShowPredictions(false)
      // Limpiar resultado cuando se borra la dirección
      if (result) {
        setResult(null)
        setGeocodedAddress(null)
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [address, isChecking])

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    // FORZAR limpieza INMEDIATA y completa - SIN DELAY
    // 1. Ocultar dropdown INMEDIATAMENTE
    setShowPredictions(false)
    // 2. Limpiar predicciones INMEDIATAMENTE
    setPredictions([])
    // 3. Establecer estado de verificación ANTES de cambiar la dirección
    setIsChecking(true)
    // 4. Establecer la dirección seleccionada
    setAddress(prediction.description)
    
    // Limpiar resultado anterior al seleccionar nueva dirección
    setResult(null)
    setGeocodedAddress(null)

    try {
      toast.info("Obteniendo coordenadas...")
      const coords = await getPlaceDetails(prediction.placeId)

      if (!coords) {
        toast.error("No se pudieron obtener las coordenadas de la dirección")
        setResult({
          en_cobertura: false,
        })
        setIsChecking(false)
        return
      }

      setGeocodedAddress(`${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`)

      // Verificar cobertura con las coordenadas
      toast.info("Verificando cobertura...")
      const coverageResult = await onCheckCoverage(coords.lat, coords.lon)
      setResult(coverageResult)
    } catch (error) {
      console.error("Error checking coverage:", error)
      toast.error("Error al verificar la cobertura")
      setResult({
        en_cobertura: false,
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCheck = () => {
    if (predictions.length > 0) {
      handleSelectPrediction(predictions[0])
    } else {
      toast.error("Por favor selecciona una dirección de la lista")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isChecking && predictions.length > 0) {
      handleSelectPrediction(predictions[0])
    }
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Verificar Cobertura
        </CardTitle>
        <CardDescription className="text-xs">
          Ingresa una dirección para verificar si está dentro de la zona de cobertura
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <Label htmlFor="address" className="text-xs">
              Dirección
            </Label>
            <Input
              ref={inputRef}
              id="address"
              type="text"
              placeholder="Ej: Calle 100 #15-20"
              value={address}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => {
                const newValue = e.target.value
                setAddress(newValue)
                // Limpiar resultado anterior cuando se empieza a escribir de nuevo
                if (result) {
                  setResult(null)
                  setGeocodedAddress(null)
                }
                // Limpiar predicciones si el texto es muy corto o se está verificando
                if (newValue.trim().length < 3 || isChecking) {
                  setPredictions([])
                  setShowPredictions(false)
                } else {
                  // Mostrar sugerencias solo si hay texto suficiente y NO se está verificando
                  setShowPredictions(true)
                }
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                // Solo mostrar sugerencias si hay texto, predicciones y NO se está verificando
                if (address.trim().length >= 3 && predictions.length > 0 && !isChecking) {
                  setShowPredictions(true)
                } else {
                  setShowPredictions(false)
                }
              }}
              onBlur={(e) => {
                // Ocultar sugerencias cuando pierde el foco
                // Verificar que el foco no vaya al dropdown
                const relatedTarget = e.relatedTarget as HTMLElement
                if (!dropdownRef.current?.contains(relatedTarget)) {
                  setShowPredictions(false)
                }
              }}
              disabled={isChecking}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ciudad: {ciudad}
            </p>

            {/* Dropdown de predicciones - Solo mostrar mientras se escribe y NO cuando se está verificando */}
            {/* FORZAR: Múltiples validaciones para asegurar que NO se muestre cuando no debe */}
            {showPredictions && 
             predictions.length > 0 && 
             address.trim().length >= 3 && 
             !isChecking && 
             !result && (
              <div 
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
                onMouseDown={(e) => {
                  // Prevenir que el blur del input oculte el dropdown al hacer clic
                  e.preventDefault()
                }}
              >
                {predictions.map((prediction) => (
                  <button
                    key={prediction.placeId}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // FORZAR limpieza inmediata antes de procesar
                      setShowPredictions(false)
                      setPredictions([])
                      handleSelectPrediction(prediction)
                    }}
                    onMouseDown={(e) => {
                      // Prevenir que el input reciba el foco
                      e.preventDefault()
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-start gap-2 border-b last:border-0 transition-colors"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{prediction.mainText}</p>
                      <p className="text-xs text-muted-foreground truncate">{prediction.secondaryText}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Solo mostrar resultado si hay una verificación activa, no mostrar coordenadas */}
        {result && !isChecking && (
          <div
            className={`p-3 rounded-lg border ${
              result.en_cobertura
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.en_cobertura ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {result.en_cobertura ? "¡Dirección con cobertura!" : "Dirección sin cobertura"}
                </p>
                {result.zona && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Zona:</span> {result.zona.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Ciudad:</span> {result.zona.ciudad}
                    </p>
                    <Badge variant="default" className="text-xs mt-1">
                      En cobertura
                    </Badge>
                  </div>
                )}
                {!result.en_cobertura && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta dirección no se encuentra dentro de ninguna zona de cobertura activa en {ciudad}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
