/**
 * Componente reutilizable para editar elementos de un bloque (título, subtítulo, descripción, CTA)
 * Soporta configuración independiente para Desktop y Mobile
 */

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FontSizeSlider } from "./FontSizeSlider";
import { FontWeightSelect, LineHeightSlider, ColorPicker, PaddingSlider, BorderRadiusSlider, BorderWidthSlider } from "./StyleControls";
import { useDeviceMode } from "./ResponsiveElementEditor";

type ElementType = 'title' | 'subtitle' | 'description' | 'cta';

interface ElementStyles {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  lineHeight?: string;
  backgroundColor?: string;
}

interface TextElement {
  text: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  lineHeight?: string;
  textTransform?: string;
  letterSpacing?: string;
  textShadow?: string;
}

interface CTAElement extends TextElement {
  link_url: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  border?: string;
}

interface BlockElementEditorProps {
  readonly type: ElementType;
  readonly element: TextElement | CTAElement | undefined;
  readonly elementMobile?: Partial<TextElement | CTAElement>; // Configuración mobile
  readonly hasElement: boolean;
  readonly onToggle: (enabled: boolean) => void;
  readonly onUpdate: (updates: Partial<TextElement | CTAElement>) => void;
  readonly onUpdateMobile: (updates: Partial<TextElement | CTAElement>) => void;
  readonly icon: string;
  readonly label: string;
  readonly borderColor: string;
  readonly placeholder: string;
  readonly defaultFontSize?: number;
}

export const BlockElementEditor = memo(function BlockElementEditor({
  type,
  element,
  elementMobile,
  hasElement,
  onToggle,
  onUpdate,
  onUpdateMobile,
  icon,
  label,
  borderColor,
  placeholder,
  defaultFontSize = 16,
}: BlockElementEditorProps) {
  const isCTA = type === 'cta';
  const deviceMode = useDeviceMode();

  if (!hasElement || !element) {
    return (
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Checkbox checked={false} onCheckedChange={(checked) => onToggle(checked as boolean)} />
          <Label className="text-xs font-medium">
            {icon} {label} {deviceMode === 'mobile' && <span className="text-green-600">(Mobile)</span>}
          </Label>
        </div>
      </div>
    );
  }

  // Después del guard, element ya no es undefined
  // Determinar qué valores mostrar según el modo de dispositivo
  const currentElement = deviceMode === 'mobile' && elementMobile 
    ? { ...element, ...elementMobile } as (TextElement | CTAElement)
    : element;
    
  // Determinar qué función de actualización usar
  const handleUpdate = deviceMode === 'mobile' ? onUpdateMobile : onUpdate;

  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={true} onCheckedChange={(checked) => onToggle(checked as boolean)} />
        <Label className="text-xs font-medium">
          {icon} {label} {deviceMode === 'mobile' && <span className="text-green-600">📱</span>}
        </Label>
      </div>
      <div className={`ml-6 space-y-2 border-l-2 ${borderColor} pl-3`}>
        {/* Texto */}
        <Textarea
          value={currentElement.text}
          onChange={(e) => {
            e.stopPropagation();
            handleUpdate({ text: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs"
          rows={isCTA ? 1 : (type === 'description' ? 3 : 2)}
          placeholder={placeholder}
        />

        {/* Link URL (solo CTA) */}
        {isCTA && (
          <Input
            type="text"
            value={(currentElement as CTAElement).link_url || ''}
            onChange={(e) => {
              e.stopPropagation();
              handleUpdate({ link_url: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="/productos"
            className="text-xs"
          />
        )}

        {/* Font Size Slider */}
        <FontSizeSlider
          value={currentElement.fontSize}
          onChange={(fontSize) => handleUpdate({ fontSize })}
          defaultSize={defaultFontSize}
        />

        {/* Controles en grid */}
        <div className="grid grid-cols-3 gap-1">
          {/* Font Weight */}
          <FontWeightSelect
            value={currentElement.fontWeight}
            onChange={(fontWeight) => handleUpdate({ fontWeight })}
          />

          {/* Line Height (no CTA) */}
          {!isCTA && (
            <LineHeightSlider
              value={currentElement.lineHeight}
              onChange={(lineHeight) => handleUpdate({ lineHeight })}
            />
          )}

          {/* Color */}
          <ColorPicker
            value={currentElement.color}
            onChange={(color) => handleUpdate({ color })}
          />

          {/* Background Color (solo CTA) */}
          {isCTA && (
            <div>
              <Label className="text-xs">Fondo</Label>
              <Input
                type="color"
                value={(currentElement as CTAElement).backgroundColor || '#ffffff'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleUpdate({ backgroundColor: e.target.value });
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-8 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Controles adicionales del CTA (padding, borde, border radius) */}
        {isCTA && (
          <div className="space-y-3 mt-2">
            <PaddingSlider
              value={(currentElement as CTAElement).padding}
              onChange={(padding) => handleUpdate({ padding })}
            />
            
            <BorderRadiusSlider
              value={(currentElement as CTAElement).borderRadius}
              onChange={(borderRadius) => handleUpdate({ borderRadius })}
            />
            
            <BorderWidthSlider
              value={(currentElement as CTAElement).border}
              onChange={(border) => handleUpdate({ border })}
            />
          </div>
        )}
      </div>
    </div>
  );
});
