/**
 * Componente integrado para gestionar Bloques de Contenido
 * Cada bloque puede tener: título, subtítulo, descripción y CTA agrupados
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentBlocksEditor } from "./content-blocks-editor";
import type { ContentBlock } from "@/types/banner";

interface ContentBlocksManagerProps {
  readonly blocks: ContentBlock[];
  readonly onAddBlock: () => void;
  readonly onRemoveBlock: (id: string) => void;
  readonly onUpdateBlock: (id: string, updates: Partial<ContentBlock>) => void;
}

export function ContentBlocksManager({ 
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock
}: ContentBlocksManagerProps) {
  return (
    <div className="space-y-4">
      {/* Editor de bloques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar Bloques</CardTitle>
          <p className="text-sm text-muted-foreground">
            Los bloques se visualizarán en el preview del banner (lado derecho)
          </p>
        </CardHeader>
        <CardContent>
          <ContentBlocksEditor
            blocks={blocks}
            onAddBlock={onAddBlock}
            onRemoveBlock={onRemoveBlock}
            onUpdateBlock={onUpdateBlock}
          />
        </CardContent>
      </Card>

      {/* JSON Output para debugging (opcional) */}
      {blocks.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Ver JSON (para debugging)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-60">
            {JSON.stringify({ content_blocks: blocks }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
