"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

export interface SchedulingSettingsData {
  sendImmediately: boolean;
  scheduledDate: Date | null;
  enableABTest: boolean;
  abTestPercentage: number;
}

interface SchedulingSettingsProps {
  data: SchedulingSettingsData;
  onChange: (data: SchedulingSettingsData) => void;
  errors?: {
    scheduledDate?: string;
  };
}

export function SchedulingSettings({ data, onChange, errors }: SchedulingSettingsProps) {
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
            onCheckedChange={(checked) =>
              onChange({
                ...data,
                sendImmediately: checked,
              })
            }
          />
          <Label htmlFor="sendImmediately">Enviar inmediatamente</Label>
        </div>

        {!data.sendImmediately && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Fecha y Hora de Envío <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={
                  data.scheduledDate
                    ? new Date(
                        data.scheduledDate.getTime() -
                          data.scheduledDate.getTimezoneOffset() *
                            60000
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  onChange({
                    ...data,
                    scheduledDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  })
                }
                min={new Date().toISOString().slice(0, 16)}
                className={errors?.scheduledDate ? "border-red-500" : ""}
              />
              {errors?.scheduledDate && (
                <p className="text-xs text-red-500">{errors.scheduledDate}</p>
              )}
            </div>
          </div>
        )}

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
