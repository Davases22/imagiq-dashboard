/**
 * Componente con tabs Desktop/Mobile para editar configuraciones independientes de cada elemento
 */

import { useState, createContext, useContext } from "react";
import type { ContentBlock } from "@/types/banner";

type DeviceMode = 'desktop' | 'mobile';

// Contexto para compartir el modo de dispositivo con componentes hijos
const DeviceModeContext = createContext<DeviceMode>('desktop');

export function useDeviceMode() {
  return useContext(DeviceModeContext);
}

interface ResponsiveElementEditorProps {
  readonly block: ContentBlock;
  readonly onUpdate: (updates: Partial<ContentBlock>) => void;
}

export function ResponsiveElementEditor({
  block,
  onUpdate,
  children,
}: ResponsiveElementEditorProps & { children?: React.ReactNode }) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  return (
    <DeviceModeContext.Provider value={deviceMode}>
      <div className="space-y-3">
        {/* Tabs Desktop/Mobile */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              deviceMode === 'desktop'
                ? 'bg-primary/10 text-primary border-b-2 border-primary dark:bg-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted'
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1 text-xs font-medium rounded-t transition-colors ${
              deviceMode === 'mobile'
                ? 'bg-primary/10 text-primary border-b-2 border-primary dark:bg-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted'
            }`}
          >
            Mobile
          </button>
          
          {deviceMode === 'mobile' && (
            <div className="ml-auto text-xs text-muted-foreground self-center">
              Configs independientes para mobile
            </div>
          )}
        </div>

      {/* Configuración del Contenedor */}
      <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg space-y-3 border border-border">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Contenedor {deviceMode === 'mobile' && '(Mobile)'}
        </h4>
        
        {/* Text Align */}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Alineación
          </label>
          <select
            value={
              deviceMode === 'mobile' && block.textAlign_mobile
                ? block.textAlign_mobile
                : block.textAlign || 'left'
            }
            onChange={(e) => {
              const fieldName = deviceMode === 'mobile' ? 'textAlign_mobile' : 'textAlign';
              onUpdate({ [fieldName]: e.target.value });
            }}
            className="w-full text-sm border border-input bg-background dark:bg-input/30 rounded-md px-3 py-1.5 focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
            <option value="justify">Justificado</option>
          </select>
        </div>

        {/* Gap */}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Espacio entre elementos: <span className="text-primary font-semibold">{deviceMode === 'mobile' && block.gap_mobile ? block.gap_mobile : block.gap || '12px'}</span>
          </label>
          <input
            type="range"
            min="0"
            max="60"
            step="4"
            value={Number.parseInt((deviceMode === 'mobile' && block.gap_mobile ? block.gap_mobile : block.gap || '12px').replace('px', ''))}
            onChange={(e) => {
              const fieldName = deviceMode === 'mobile' ? 'gap_mobile' : 'gap';
              onUpdate({ [fieldName]: `${e.target.value}px` });
            }}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0px</span>
            <span>60px</span>
          </div>
        </div>
      </div>

        {/* Mensaje explicativo */}
        {deviceMode === 'mobile' && (
          <div className="text-xs text-muted-foreground bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-md p-2.5">
            <strong className="text-foreground">Tip:</strong> Los estilos de cada elemento (título, subtítulo, etc) también se pueden configurar de forma independiente para mobile.
            Edítalos más abajo con este modo activo.
          </div>
        )}
        
        {/* Contenido adicional (elementos) */}
        {children}
      </div>
    </DeviceModeContext.Provider>
  );
}
