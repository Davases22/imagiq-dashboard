/**
 * Componente optimizado para gestionar cajas de contenido
 * Permite agregar, editar y eliminar boxes con UI compacta
 */

"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { ContentBox, CTABox } from "@/types/banner";
import { FontSizeSlider } from "./shared/FontSizeSlider";
import { FontWeightSelect, TextAlignSelect, TextTransformSelect } from "./shared/StyleControls";

type BoxType = 'title' | 'description' | 'cta';

interface BoxEditorProps {
  readonly box: ContentBox | CTABox;
  readonly type: BoxType;
  readonly index: number;
  readonly isExpanded: boolean;
  readonly onToggleExpand: (id: string) => void;
  readonly onRemove: (type: BoxType, id: string) => void;
  readonly onUpdate: (type: BoxType, id: string, updates: Partial<ContentBox | CTABox>) => void;
}

// Helper function to get box icon based on type
function getBoxIcon(type: BoxType): string {
  if (type === 'title') return '📝 Título';
  if (type === 'description') return '📄 Descripción';
  return '🔘 Botón';
}

// Helper function to get default font size based on type
function getDefaultFontSize(type: BoxType): number {
  if (type === 'title') return 32;
  if (type === 'description') return 16;
  return 14;
}

/**
 * Componente separado y memoizado para editar una caja individual
 * Evita re-renderizados innecesarios cuando otras cajas cambian
 */
const BoxEditor = memo(function BoxEditor({
  box,
  type,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
  onUpdate
}: BoxEditorProps) {
  const isCTA = type === 'cta';

  const updateStyle = (key: string, value: string) => {
    onUpdate(type, box.id, {
      styles: { ...box.styles, [key]: value }
    });
  };

  return (
    <Card className="mb-3">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm">
              {getBoxIcon(type)} #{index + 1}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(box.id)}
            >
              {isExpanded ? '▲' : '▼'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(type, box.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-3 pt-3 space-y-3">
          {/* Texto */}
          <div>
            <Label className="text-xs">Texto {type === 'title' && String.raw`(Usa \n para saltos de línea)`}</Label>
            <Textarea
              value={box.text}
              onChange={(e) => onUpdate(type, box.id, { text: e.target.value })}
              className="text-sm"
              rows={3}
            />
          </div>

          {/* Link (solo CTA) */}
          {isCTA && (
            <div>
              <Label className="text-xs">URL del botón</Label>
              <Input
                type="text"
                value={(box as CTABox).link_url || ''}
                onChange={(e) => onUpdate(type, box.id, { link_url: e.target.value })}
                placeholder="/productos"
                className="text-sm"
              />
            </div>
          )}

          {/* Estilos */}
          <div className="space-y-3">
            {/* Font Size Slider */}
            <FontSizeSlider
              value={box.styles?.fontSize}
              onChange={(fontSize) => updateStyle('fontSize', fontSize)}
              defaultSize={getDefaultFontSize(type)}
            />

            <div className="grid grid-cols-2 gap-2">
              {/* Font Weight */}
              <FontWeightSelect
                value={box.styles?.fontWeight}
                onChange={(fontWeight) => updateStyle('fontWeight', fontWeight)}
              />

              {/* Text Align */}
              <TextAlignSelect
                value={box.styles?.textAlign}
                onChange={(textAlign) => updateStyle('textAlign', textAlign)}
              />

              {/* Color Picker */}
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={box.styles?.color || '#ffffff'}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={box.styles?.color || '#ffffff'}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    className="text-xs flex-1"
                  />
                </div>
              </div>

              {/* Text Transform */}
              <TextTransformSelect
                value={box.styles?.textTransform}
                onChange={(textTransform) => updateStyle('textTransform', textTransform)}
              />

              {/* Background Color (solo CTA) */}
              {isCTA && (
                <div className="col-span-2">
                  <Label className="text-xs">Fondo del Botón</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={(box.styles as CTABox['styles'])?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      type="text"
                      value={(box.styles as CTABox['styles'])?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                      className="text-xs flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

interface ContentBoxesEditorProps {
  readonly titleBoxes: ContentBox[];
  readonly descriptionBoxes: ContentBox[];
  readonly ctaBoxes: CTABox[];
  readonly onAddBox: (type: BoxType) => void;
  readonly onRemoveBox: (type: BoxType, id: string) => void;
  readonly onUpdateBox: (type: BoxType, id: string, updates: Partial<ContentBox | CTABox>) => void;
}

export function ContentBoxesEditor({
  titleBoxes,
  descriptionBoxes,
  ctaBoxes,
  onAddBox,
  onRemoveBox,
  onUpdateBox,
}: ContentBoxesEditorProps) {
  const [expandedBox, setExpandedBox] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedBox(current => current === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header con botones */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddBox('title')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Título
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddBox('description')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Descripción
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddBox('cta')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Botón
        </Button>
      </div>

      {/* Lista de cajas */}
      <div className="space-y-2">
        {titleBoxes.map((box, i) => (
          <BoxEditor
            key={box.id}
            box={box}
            type="title"
            index={i}
            isExpanded={expandedBox === box.id}
            onToggleExpand={handleToggleExpand}
            onRemove={onRemoveBox}
            onUpdate={onUpdateBox}
          />
        ))}
        {descriptionBoxes.map((box, i) => (
          <BoxEditor
            key={box.id}
            box={box}
            type="description"
            index={i}
            isExpanded={expandedBox === box.id}
            onToggleExpand={handleToggleExpand}
            onRemove={onRemoveBox}
            onUpdate={onUpdateBox}
          />
        ))}
        {ctaBoxes.map((box, i) => (
          <BoxEditor
            key={box.id}
            box={box}
            type="cta"
            index={i}
            isExpanded={expandedBox === box.id}
            onToggleExpand={handleToggleExpand}
            onRemove={onRemoveBox}
            onUpdate={onUpdateBox}
          />
        ))}
      </div>

      {/* Contador */}
      <div className="text-xs text-gray-500 text-center">
        {titleBoxes.length + descriptionBoxes.length + ctaBoxes.length} cajas en total
      </div>
    </div>
  );
}
