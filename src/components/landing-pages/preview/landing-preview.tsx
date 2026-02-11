"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Monitor, ArrowLeft } from "lucide-react"

interface LandingPagePreviewProps {
    data: any // Using any for flexibility as we construct the payload manually
    baseUrl?: string
}

export function LandingPagePreview({ data, baseUrl = "http://localhost:3000" }: LandingPagePreviewProps) {
    const router = useRouter()
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [scale, setScale] = useState(1)

    // Handle resize for desktop scaling
    useEffect(() => {
        if (device === 'mobile') {
            setScale(1)
            return
        }

        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth
                // Target width for desktop – use a wider viewport so the preview looks more zoomed-out
                const targetWidth = 1440

                const newScale = Math.min(containerWidth / targetWidth, 1)
                console.log("Preview Scale:", { containerWidth, targetWidth, newScale, device })
                setScale(newScale)
            }
        }

        calculateScale() // Initial calculation

        const observer = new ResizeObserver(calculateScale)
        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [device])

    // Send updates when data changes
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow && iframeLoaded) {
            console.log("Sending preview update to iframe", data)
            iframeRef.current.contentWindow.postMessage({
                type: 'PREVIEW_UPDATE',
                payload: data
            }, '*')
        }
    }, [data, iframeLoaded])

    // Listen for iframe ready message
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PREVIEW_READY') {
                console.log("Iframe reported ready, sending initial data")
                setIframeLoaded(true)
                // Force send data immediately when ready
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({
                        type: 'PREVIEW_UPDATE',
                        payload: data
                    }, '*')
                }
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [data]) // Re-bind if data changes so we always send fresh data

    // Generate slug from title for visual consistency
    // The frontend now handles ?mode=preview on ANY slug
    const titleSlug = data.page.title
        ? data.page.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : 'nueva-landing';

    const previewUrl = `${baseUrl}/${titleSlug || 'nueva-landing'}?mode=preview`

    return (
        <Card className="h-full flex flex-col overflow-hidden border-2 border-primary/20 sticky top-4">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1 flex items-center gap-2">
                        <CardTitle className="text-lg">Vista Previa en Vivo</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1 bg-background border rounded-md p-1">
                        <Button
                            type="button" // Prevent form submission
                            variant={device === "desktop" ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDevice("desktop")}
                            title="Vista de Escritorio"
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button" // Prevent form submission
                            variant={device === "mobile" ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDevice("mobile")}
                            title="Vista Móvil"
                        >
                            <Smartphone className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-gray-100 flex justify-center overflow-hidden relative">
                <div
                    ref={containerRef}
                    className="p-0 flex-1 bg-gray-100 flex justify-center overflow-hidden relative w-full h-full"
                >
                    <div
                        className="transition-all duration-300 ease-in-out bg-white shadow-xl overflow-hidden origin-top shrink-0"
                        style={{
                            width: device === "mobile" ? "375px" : "1440px",
                            minWidth: device === "mobile" ? "375px" : "1440px", // Force strict width
                            maxWidth: 'none',
                            height: device === "mobile" ? "100%" : `${(100 / scale)}%`,
                            transform: device === "mobile" ? "none" : `scale(${scale})`,
                            transformOrigin: 'top center', // Center the scaling
                            marginTop: device === "mobile" ? "0" : "20px",
                            marginBottom: device === "mobile" ? "0" : "20px",
                            border: device === "mobile" ? "1px solid #e2e8f0" : "none",
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="w-full h-full border-0 block bg-white"
                            title="Landing Page Preview"
                            onLoad={() => {
                                setIframeLoaded(true)
                                // Send initial data once loaded
                                if (iframeRef.current && iframeRef.current.contentWindow) {
                                    iframeRef.current.contentWindow.postMessage({
                                        type: 'PREVIEW_UPDATE',
                                        payload: data
                                    }, '*')
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Loading overlay for iframe */}
                {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Cargando previsualización...</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
