"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  PermissionItem,
  PermissionAction,
  PermissionResource,
  UpdatePermissionsPayload
} from "@/types/users";
import { Shield, Save, X, CheckCircle2, XCircle } from "lucide-react";

interface UserPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentPermissions?: PermissionItem[];
  onSave: (payload: UpdatePermissionsPayload) => void;
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
 // 'punto_fisico',
  // 'bodega',
  // 'zonas_de_cobertura',
  // 'facturacion'
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
  'punto_fisico': 'Punto Físico',
  'bodega': 'Bodega',
  'zonas_de_cobertura': 'Zonas de Cobertura',
  'facturacion': 'Facturación'
};

const actionLabels: Record<PermissionAction, string> = {
  'create': 'Crear',
  'read': 'Leer',
  'update': 'Actualizar',
  'delete': 'Eliminar'
};

export function UserPermissionsModal({
  open,
  onClose,
  userId,
  userName,
  currentPermissions = [],
  onSave,
}: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  // Inicializar permisos cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Crear una lista completa de permisos con todos los recursos y acciones
      const allPermissions: PermissionItem[] = [];

      permissionResources.forEach(recurso => {
        permissionActions.forEach(accion => {
          // Buscar si existe este permiso en los permisos actuales
          const existingPermission = currentPermissions.find(
            p => p.recurso === recurso && p.accion === accion
          );

          allPermissions.push({
            recurso,
            accion,
            permitido: existingPermission?.permitido || false
          });
        });
      });

      setPermissions(allPermissions);
    }
  }, [open, currentPermissions]);

  const handlePermissionToggle = (recurso: PermissionResource, accion: PermissionAction) => {
    setPermissions(prev =>
      prev.map(p =>
        p.recurso === recurso && p.accion === accion
          ? { ...p, permitido: !p.permitido }
          : p
      )
    );
  };

  const handleSelectAllForResource = (recurso: PermissionResource, permitido: boolean) => {
    setPermissions(prev =>
      prev.map(p =>
        p.recurso === recurso
          ? { ...p, permitido }
          : p
      )
    );
  };

  const handleSubmit = () => {
    const payload: UpdatePermissionsPayload = {
      userId,
      permisos: permissions
    };
    onSave(payload);
    onClose();
  };

  const getPermissionStatus = (recurso: PermissionResource) => {
    const resourcePermissions = permissions.filter(p => p.recurso === recurso);
    const allowedCount = resourcePermissions.filter(p => p.permitido).length;
    const totalCount = resourcePermissions.length;

    if (allowedCount === 0) return { color: 'text-red-500', icon: XCircle, text: 'Sin acceso' };
    if (allowedCount === totalCount) return { color: 'text-green-500', icon: CheckCircle2, text: 'Acceso completo' };
    return { color: 'text-yellow-500', icon: Shield, text: `${allowedCount}/${totalCount} permisos` };
  };

  const totalPermissionsAllowed = permissions.filter(p => p.permitido).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionar Permisos
          </DialogTitle>
          <DialogDescription>
            Configura los permisos de acceso para <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

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
              const resourcePermissions = permissions.filter(p => p.recurso === recurso);
              const allAllowed = resourcePermissions.every(p => p.permitido);
              const someAllowed = resourcePermissions.some(p => p.permitido);

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
                        onClick={() => handleSelectAllForResource(recurso, true)}
                        className="h-7 text-xs"
                      >
                        Permitir todos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllForResource(recurso, false)}
                        className="h-7 text-xs"
                      >
                        Denegar todos
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-4">
                    {permissionActions.map((accion) => {
                      const permission = permissions.find(
                        p => p.recurso === recurso && p.accion === accion
                      );

                      return (
                        <div key={`${recurso}-${accion}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${recurso}-${accion}`}
                            checked={permission?.permitido || false}
                            onCheckedChange={() => handlePermissionToggle(recurso, accion)}
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
