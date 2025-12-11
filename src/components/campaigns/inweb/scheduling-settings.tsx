"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

export interface SchedulingSettingsData {
  sendImmediately: boolean;
  scheduledDate: Date | null;
  finalDate: Date | null;
  enableABTest: boolean;
  abTestPercentage: number;
}

interface SchedulingSettingsProps {
  data: SchedulingSettingsData;
  onChange: (data: SchedulingSettingsData) => void;
}

export function SchedulingSettings({ data, onChange }: SchedulingSettingsProps) {
  // Auto-set initial date to current time when sendImmediately is enabled
  useEffect(() => {
    if (data.sendImmediately && !data.scheduledDate) {
      onChange({
        ...data,
        scheduledDate: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sendImmediately]);

  // Get the current date/time for display when sendImmediately is true
  const getCurrentDateTimeString = () => {
    const now = new Date();
    return new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
  };

  // Get the initial date value (current time if sendImmediately, otherwise user-selected)
  const getInitialDateValue = () => {
    if (data.sendImmediately) {
      return getCurrentDateTimeString();
    }
    return data.scheduledDate
      ? new Date(
          data.scheduledDate.getTime() -
            data.scheduledDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
      : "";
  };

  // Get min date for final date (should be after initial date)
  const getFinalDateMin = () => {
    if (data.sendImmediately) {
      return getCurrentDateTimeString();
    }
    return data.scheduledDate
      ? new Date(
          data.scheduledDate.getTime() -
            data.scheduledDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
      : new Date().toISOString().slice(0, 16);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Programación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="sendImmediately"
            checked={data.sendImmediately}
            onCheckedChange={(checked) => {
              const newData = {
                ...data,
                sendImmediately: checked,
              };
              // Auto-set to current time when enabling sendImmediately
              if (checked) {
                newData.scheduledDate = new Date();
              }
              onChange(newData);
            }}
          />
          <Label htmlFor="sendImmediately">Enviar inmediatamente</Label>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">
              Fecha y Hora de Inicio
              {data.sendImmediately && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Se iniciará inmediatamente)
                </span>
              )}
            </Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={getInitialDateValue()}
              onChange={(e) =>
                onChange({
                  ...data,
                  scheduledDate: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
              disabled={data.sendImmediately}
              min={new Date().toISOString().slice(0, 16)}
              className={data.sendImmediately ? "bg-muted cursor-not-allowed" : ""}
            />
            {data.sendImmediately && (
              <p className="text-xs text-muted-foreground">
                La campaña comenzará a mostrarse inmediatamente al publicar
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="finalDate">Fecha y Hora de Finalización</Label>
            <Input
              id="finalDate"
              type="datetime-local"
              value={
                data.finalDate
                  ? new Date(
                      data.finalDate.getTime() -
                        data.finalDate.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...data,
                  finalDate: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
              min={getFinalDateMin()}
            />
            <p className="text-xs text-muted-foreground">
              La campaña dejará de mostrarse después de esta fecha
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enableABTest"
            checked={data.enableABTest}
            onCheckedChange={(checked) =>
              onChange({ ...data, enableABTest: checked })
            }
          />
          <Label htmlFor="enableABTest">Habilitar prueba A/B</Label>
        </div>

        {data.enableABTest && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="abTestPercentage">
                Porcentaje de prueba (%)
              </Label>
              <Input
                id="abTestPercentage"
                type="number"
                min="1"
                max="99"
                value={data.abTestPercentage === 0 ? "" : data.abTestPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    onChange({ ...data, abTestPercentage: 0 });
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      onChange({
                        ...data,
                        abTestPercentage: Math.min(99, Math.max(0, numValue)),
                      });
                    }
                  }
                }}
                onBlur={() => {
                  if (data.abTestPercentage < 1) {
                    onChange({ ...data, abTestPercentage: 1 });
                  } else if (data.abTestPercentage > 99) {
                    onChange({ ...data, abTestPercentage: 99 });
                  }
                }}
                placeholder="Ej: 50"
              />
              <p className="text-sm text-muted-foreground">
                El {data.abTestPercentage}% recibirá la versión A y el{" "}
                {100 - data.abTestPercentage}% recibirá la versión B
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
