"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";

export interface CampaignInfoData {
  campaignName: string;
  campaignType: string;
}

interface CampaignInfoProps {
  data: CampaignInfoData;
  onChange: (data: CampaignInfoData) => void;
  errors?: {
    campaignName?: string;
  };
}

export function CampaignInfo({ data, onChange, errors }: CampaignInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Información de la Campaña
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="campaignName">
            Nombre de la Campaña <span className="text-red-500">*</span>
          </Label>
          <Input
            id="campaignName"
            placeholder="Ej: Push Black Friday 2024"
            value={data.campaignName}
            onChange={(e) =>
              onChange({
                ...data,
                campaignName: e.target.value,
              })
            }
            className={errors?.campaignName ? "border-red-500" : ""}
          />
          {errors?.campaignName && (
            <p className="text-xs text-red-500">{errors.campaignName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignType">Tipo de Campaña</Label>
          <Select
            value={data.campaignType}
            onValueChange={(value) =>
              onChange({ ...data, campaignType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotional">Promocional</SelectItem>
              <SelectItem value="transactional">Transaccional</SelectItem>
              <SelectItem value="news">Noticias</SelectItem>
              <SelectItem value="reminder">Recordatorio</SelectItem>
              <SelectItem value="abandoned-cart">
                Carrito Abandonado
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
