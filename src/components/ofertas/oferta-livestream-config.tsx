"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { LivestreamConfig } from "@/types/page"
import { Video, MessageSquare, Clock, Radio, Shield, Layout } from "lucide-react"

interface OfertaLivestreamConfigProps {
  config: LivestreamConfig
  onConfigChange: (config: LivestreamConfig) => void
}

/**
 * Extracts a YouTube video ID from various URL formats or returns the raw string if already an ID.
 */
function extractVideoId(input: string): string {
  const trimmed = input.trim()
  // Already a video ID (11 alphanumeric chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    // youtube.com/watch?v=ID or youtube.com/live/ID
    if (url.hostname.includes("youtube.com")) {
      const vParam = url.searchParams.get("v")
      if (vParam) return vParam
      const pathMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/)
      if (pathMatch) return pathMatch[1]
    }
    // youtu.be/ID
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1)
    }
  } catch {
    // Not a URL, return as-is
  }
  return trimmed
}

export function OfertaLivestreamConfig({ config, onConfigChange }: OfertaLivestreamConfigProps) {
  const update = (partial: Partial<LivestreamConfig>) => {
    onConfigChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Video IDs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Video className="h-4 w-4" />
          Videos de YouTube
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_video_id">Link Principal *</Label>
          <Input
            id="primary_video_id"
            placeholder="https://youtube.com/live/SA93zbnoR4U o SA93zbnoR4U"
            value={config.primary_video_id}
            onChange={(e) => update({ primary_video_id: extractVideoId(e.target.value) })}
          />
          {config.primary_video_id && (
            <p className="text-xs text-muted-foreground">
              Video ID: <code className="bg-muted px-1 rounded">{config.primary_video_id}</code>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup_video_id">Link de Backup</Label>
          <Input
            id="backup_video_id"
            placeholder="https://youtube.com/live/Rq02daf0B3U (opcional)"
            value={config.backup_video_id || ""}
            onChange={(e) => update({ backup_video_id: e.target.value ? extractVideoId(e.target.value) : undefined })}
          />
          {config.backup_video_id && (
            <p className="text-xs text-muted-foreground">
              Video ID: <code className="bg-muted px-1 rounded">{config.backup_video_id}</code>
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          Programacion
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled_start">Inicio del Stream *</Label>
            <Input
              id="scheduled_start"
              type="datetime-local"
              value={config.scheduled_start ? config.scheduled_start.slice(0, 16) : ""}
              onChange={(e) => update({ scheduled_start: e.target.value || "" })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_end">Fin del Stream</Label>
            <Input
              id="scheduled_end"
              type="datetime-local"
              value={config.scheduled_end ? config.scheduled_end.slice(0, 16) : ""}
              onChange={(e) => update({ scheduled_end: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Radio className="h-4 w-4" />
          Opciones de Visualizacion
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Countdown</Label>
              <p className="text-xs text-muted-foreground">Mostrar cuenta regresiva antes del inicio</p>
            </div>
            <Switch checked={config.enable_countdown} onCheckedChange={(v) => update({ enable_countdown: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Badge EN VIVO</Label>
              <p className="text-xs text-muted-foreground">Indicador rojo pulsante durante la transmision</p>
            </div>
            <Switch checked={config.enable_live_badge} onCheckedChange={(v) => update({ enable_live_badge: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autoplay</Label>
              <p className="text-xs text-muted-foreground">Reproducir automaticamente (siempre silenciado)</p>
            </div>
            <Switch checked={config.autoplay} onCheckedChange={(v) => update({ autoplay: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Replay</Label>
              <p className="text-xs text-muted-foreground">Permitir reproduccion despues de finalizar</p>
            </div>
            <Switch checked={config.enable_replay} onCheckedChange={(v) => update({ enable_replay: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mini-Player (PiP)</Label>
              <p className="text-xs text-muted-foreground">Video flotante al hacer scroll</p>
            </div>
            <Switch checked={config.enable_pip} onCheckedChange={(v) => update({ enable_pip: v })} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Chat */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Chat en Vivo
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Activar Chat</Label>
            <p className="text-xs text-muted-foreground">Mostrar chat de YouTube junto al video</p>
          </div>
          <Switch checked={config.enable_chat} onCheckedChange={(v) => update({ enable_chat: v })} />
        </div>

        {config.enable_chat && (
          <div className="space-y-2">
            <Label>Posicion del Chat</Label>
            <RadioGroup
              value={config.chat_position}
              onValueChange={(v) => update({ chat_position: v as 'right' | 'below' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="chat-right" />
                <Label htmlFor="chat-right" className="font-normal">A la derecha (desktop)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="below" id="chat-below" />
                <Label htmlFor="chat-below" className="font-normal">Debajo del video</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>

      <Separator />

      {/* Failover */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Failover
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Failover Automatico</Label>
            <p className="text-xs text-muted-foreground">Cambiar al backup si el stream principal falla</p>
          </div>
          <Switch
            checked={config.failover_enabled}
            onCheckedChange={(v) => update({ failover_enabled: v })}
            disabled={!config.backup_video_id}
          />
        </div>

        {config.failover_enabled && (
          <div className="space-y-2">
            <Label htmlFor="failover_message">Mensaje de Transicion</Label>
            <Input
              id="failover_message"
              placeholder="Cambiando transmision..."
              value={config.failover_message || ""}
              onChange={(e) => update({ failover_message: e.target.value || undefined })}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Branding */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layout className="h-4 w-4" />
          Branding
        </div>

        <div className="space-y-2">
          <Label htmlFor="countdown_title">Titulo del Countdown</Label>
          <Input
            id="countdown_title"
            placeholder="Samsung Series 26 Launch"
            value={config.countdown_title || ""}
            onChange={(e) => update({ countdown_title: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="countdown_subtitle">Subtitulo del Countdown</Label>
          <Input
            id="countdown_subtitle"
            placeholder="Muy pronto..."
            value={config.countdown_subtitle || ""}
            onChange={(e) => update({ countdown_subtitle: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">URL del Thumbnail (opcional)</Label>
          <Input
            id="thumbnail_url"
            placeholder="https://... (si esta vacio, usa el de YouTube)"
            value={config.thumbnail_url || ""}
            onChange={(e) => update({ thumbnail_url: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  )
}
