"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PermissionItem,
  PermissionAction,
  PermissionResource,
} from "@/types/users";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

interface UserFormStep2Props {
  permissions: PermissionItem[];
  onPermissionToggle: (recurso: PermissionResource, accion: PermissionAction) => void;
  onSelectAllForResource: (recurso: PermissionResource, permitido: boolean) => void;
}

const permissionResources: PermissionResource[] = [
  'usuarios',
  'ordenes',
  'productos',
  'marketing',
  'envios',
  'atencion_cliente',
  'pagina_web',
  'metricas',
  'punto_fisico',
  'bodega',
  'zonas_de_cobertura',
  'facturacion'
];

const permissionActions: PermissionAction[] = ['create', 'read', 'update', 'delete'];

const resourceLabels: Record<PermissionResource, string> = {
  'usuarios': 'Usuarios',
  'ordenes': 'Órdenes',
  'productos': 'Productos',
  'marketing': 'Marketing',
  'envios': 'Envíos',
  'atencion_cliente': 'Atención al Cliente',
  'pagina_web': 'Página Web',
  'metricas': 'Métricas',
  'punto_fisico' :'Punto Físico',
  'bodega': 'Bodega',
  'zonas_de_cobertura': 'Zonas de Cobertura',
  'facturacion':  'Facturación'
};

const actionLabels: Record<PermissionAction, string> = {
  'create': 'Crear',
  'read': 'Leer',
  'update': 'Actualizar',
  'delete': 'Eliminar'
};

export function UserFormStep2({
  permissions,
  onPermissionToggle,
  onSelectAllForResource
}: UserFormStep2Props) {
  console.log("Permissions in Step 2:", permissions);
  const totalPermissionsAllowed = permissions.filter(p => p.permitido).length;

  const getPermissionStatus = (recurso: PermissionResource) => {
    const resourcePermissions = permissions.filter(p => p.recurso === recurso);
    const allowedCount = resourcePermissions.filter(p => p.permitido).length;
    const totalCount = resourcePermissions.length;

    if (allowedCount === 0) return { color: 'text-red-500', icon: XCircle, text: 'Sin acceso' };
    if (allowedCount === totalCount) return { color: 'text-green-500', icon: CheckCircle2, text: 'Acceso completo' };
    return { color: 'text-yellow-500', icon: Shield, text: `${allowedCount}/${totalCount} permisos` };
  };

  return (
    <>
      <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Total de permisos activos:
          </span>
        </div>
        <Badge variant="outline" className="text-sm">
          {totalPermissionsAllowed} / {permissions.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-[50vh] pr-4">
        <div className="space-y-6">
          {permissionResources.map((recurso) => {
            const status = getPermissionStatus(recurso);
            const StatusIcon = status.icon;

            return (
              <div key={recurso} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide">
                      {resourceLabels[recurso]}
                    </h4>
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-xs ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAllForResource(recurso, true)}
                      className="h-7 text-xs"
                    >
                      Permitir todos
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAllForResource(recurso, false)}
                      className="h-7 text-xs"
                    >
                      Denegar todos
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {permissionActions.map((accion) => {
                    const permission = permissions.find(
                      p => p.recurso === recurso && p.accion === accion
                    );

                    return (
                      <div key={`${recurso}-${accion}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${recurso}-${accion}`}
                          checked={permission?.permitido || false}
                          onCheckedChange={() => onPermissionToggle(recurso, accion)}
                        />
                        <label
                          htmlFor={`${recurso}-${accion}`}
                          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {actionLabels[accion]}
                        </label>
                      </div>
                    );
                  })}
                </div>

                <Separator />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
