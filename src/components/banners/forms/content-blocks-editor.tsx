/**
 * Editor de bloques de contenido
 * Cada bloque puede contener múltiples elementos agrupados
 */

"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { ContentBlock } from "@/types/banner";
import { BlockElementEditor } from "./shared/BlockElementEditor";
import { ResponsiveElementEditor } from "./shared/ResponsiveElementEditor";

type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize' | undefined;

interface BlockEditorProps {
  readonly block: ContentBlock;
  readonly index: number;
  readonly isExpanded: boolean;
  readonly onToggleExpand: (id: string) => void;
  readonly onRemove: (id: string) => void;
  readonly onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
}

/**
 * Componente separado y memoizado para editar un bloque individual
 * Evita re-renderizados innecesarios cuando otros bloques cambian
 */
const BlockEditor = memo(function BlockEditor({
  block,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
  onUpdate
}: BlockEditorProps) {

  // Determinar qué elementos tiene el bloque
  const hasTitle = !!block.title;
  const hasSubtitle = !!block.subtitle;
  const hasDescription = !!block.description;
  const hasCTA = !!block.cta;

  // Agregar elemento con valores por defecto
  const addElement = (element: 'title' | 'subtitle' | 'description' | 'cta') => {
    const defaults: {
      title: ContentBlock['title'];
      subtitle: ContentBlock['subtitle'];
      description: ContentBlock['description'];
      cta: ContentBlock['cta'];
    } = {
      title: {
        text: 'Nuevo Título',
        fontSize: '2rem',
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: '1.2',
        textTransform: 'none' as const,
        letterSpacing: 'normal',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      },
      subtitle: {
        text: 'Nuevo Subtítulo',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#ffffff',
        lineHeight: '1.3',
        textTransform: 'none' as const,
      },
      description: {
        text: 'Nueva descripción',
        fontSize: '1rem',
        fontWeight: '400',
        color: '#ffffff',
        lineHeight: '1.5',
      },
      cta: {
        text: 'Ver más',
        link_url: '#',
        fontSize: '1rem',
        fontWeight: '600',
        backgroundColor: 'transparent',
        color: '#000000',
        padding: '12px 32px',
        borderRadius: '50px',
        border: '2px solid #000000',
      },
    };
    onUpdate(block.id, { [element]: defaults[element] });
  };

  // Quitar elemento
  const removeElement = (element: 'title' | 'subtitle' | 'description' | 'cta') => {
    onUpdate(block.id, { [element]: undefined });
  };

  return (
    <Card className="mb-3">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm">
              Bloque #{index + 1}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(block.id)}
            >
              {isExpanded ? '▲' : '▼'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(block.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-3 pt-3 space-y-4">
          {/* Configuración del bloque - Desktop/Mobile separado */}
          <ResponsiveElementEditor
            block={block}
            onUpdate={(updates: Partial<ContentBlock>) => onUpdate(block.id, updates)}
          >
            {/* Elementos del bloque */}
            <div className="mt-4">
              <Label className="text-xs font-semibold mb-2 block">Elementos del Bloque</Label>

            {/* Título */}
            <BlockElementEditor
              type="title"
              element={block.title}
              elementMobile={block.title_mobile}
              hasElement={hasTitle}
              onToggle={(enabled) => enabled ? addElement('title') : removeElement('title')}
              onUpdate={(updates) => {
                if (block.title) {
                  onUpdate(block.id, { 
                    title: { 
                      ...block.title, 
                      ...updates,
                      textTransform: (updates.textTransform as TextTransform) ?? block.title.textTransform
                    } 
                  });
                }
              }}
              onUpdateMobile={(updates) => {
                onUpdate(block.id, { 
                  title_mobile: { 
                    ...(block.title_mobile || {}),
                    ...updates,
                    textTransform: (updates.textTransform as TextTransform) ?? block.title_mobile?.textTransform
                  } 
                });
              }}
              icon="📝"
              label="Título"
              borderColor="border-blue-200"
              placeholder="Texto del título"
              defaultFontSize={32}
            />

            {/* Subtítulo */}
            <BlockElementEditor
              type="subtitle"
              element={block.subtitle}
              elementMobile={block.subtitle_mobile}
              hasElement={hasSubtitle}
              onToggle={(enabled) => enabled ? addElement('subtitle') : removeElement('subtitle')}
              onUpdate={(updates) => {
                if (block.subtitle) {
                  onUpdate(block.id, { 
                    subtitle: { 
                      ...block.subtitle, 
                      ...updates,
                      textTransform: (updates.textTransform as TextTransform) ?? block.subtitle.textTransform
                    } 
                  });
                }
              }}
              onUpdateMobile={(updates) => {
                onUpdate(block.id, { 
                  subtitle_mobile: { 
                    ...(block.subtitle_mobile || {}),
                    ...updates,
                    textTransform: (updates.textTransform as TextTransform) ?? block.subtitle_mobile?.textTransform
                  } 
                });
              }}
              icon="🏷️"
              label="Subtítulo"
              borderColor="border-green-200"
              placeholder="Texto del subtítulo"
              defaultFontSize={24}
            />

            {/* Descripción */}
            <BlockElementEditor
              type="description"
              element={block.description}
              elementMobile={block.description_mobile}
              hasElement={hasDescription}
              onToggle={(enabled) => enabled ? addElement('description') : removeElement('description')}
              onUpdate={(updates) => {
                if (block.description) {
                  onUpdate(block.id, { 
                    description: { 
                      ...block.description, 
                      ...updates,
                      textTransform: (updates.textTransform as TextTransform) ?? block.description.textTransform
                    } 
                  });
                }
              }}
              onUpdateMobile={(updates) => {
                onUpdate(block.id, { 
                  description_mobile: { 
                    ...(block.description_mobile || {}),
                    ...updates,
                    textTransform: (updates.textTransform as TextTransform) ?? block.description_mobile?.textTransform
                  } 
                });
              }}
              icon="📄"
              label="Descripción"
              borderColor="border-yellow-200"
              placeholder="Texto de la descripción"
              defaultFontSize={16}
            />

            {/* CTA */}
            <BlockElementEditor
              type="cta"
              element={block.cta}
              elementMobile={block.cta_mobile}
              hasElement={hasCTA}
              onToggle={(enabled) => enabled ? addElement('cta') : removeElement('cta')}
              onUpdate={(updates) => {
                if (block.cta) {
                  onUpdate(block.id, { 
                    cta: { 
                      ...block.cta, 
                      ...updates,
                      textTransform: (updates.textTransform as TextTransform) ?? block.cta.textTransform
                    } 
                  });
                }
              }}
              onUpdateMobile={(updates) => {
                onUpdate(block.id, { 
                  cta_mobile: { 
                    ...(block.cta_mobile || {}),
                    ...updates,
                    textTransform: (updates.textTransform as TextTransform) ?? block.cta_mobile?.textTransform
                  } 
                });
              }}
              icon="🔘"
              label="Botón (CTA)"
              borderColor="border-purple-200"
              placeholder="Texto del botón"
              defaultFontSize={16}
            />
            </div>
          </ResponsiveElementEditor>
        </CardContent>
      )}
    </Card>
  );
});

interface ContentBlocksEditorProps {
  readonly blocks: ContentBlock[];
  readonly onAddBlock: () => void;
  readonly onRemoveBlock: (id: string) => void;
  readonly onUpdateBlock: (id: string, updates: Partial<ContentBlock>) => void;
}

export function ContentBlocksEditor({
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
}: ContentBlocksEditorProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedBlock(current => current === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddBlock}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Bloque de Contenido
        </Button>
      </div>

      {/* Lista de bloques */}
      <div className="space-y-2">
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No hay bloques. Click en "Agregar Bloque" para empezar.
          </div>
        ) : (
          blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={i}
              isExpanded={expandedBlock === block.id}
              onToggleExpand={handleToggleExpand}
              onRemove={onRemoveBlock}
              onUpdate={onUpdateBlock}
            />
          ))
        )}
      </div>

      {/* Contador */}
      <div className="text-xs text-gray-500 text-center">
        {blocks.length} bloque{blocks.length === 1 ? '' : 's'} en total
      </div>
    </div>
  );
}
