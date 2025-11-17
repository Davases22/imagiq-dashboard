import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { User, PermissionItem, PermissionAction, PermissionResource } from "@/types/users";
import { userEndpoints } from "@/lib/api";

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

export function useUserFormData(
  open: boolean,
  user: User | undefined,
  form: UseFormReturn<any>
) {
  const isEditing = !!user;
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const initializePermissions = (currentPermissions: PermissionItem[]) => {
    const allPermissions: PermissionItem[] = [];

    permissionResources.forEach(recurso => {
      permissionActions.forEach(accion => {
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
console.log("Initialized Permissions:", allPermissions);
    setPermissions(allPermissions);
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (open && isEditing && user?.id) {
        setIsLoadingUserData(true);
        try {
          const response = await userEndpoints.getById(user.id);

          if (response.success && response.data) {
            const userData = response.data;

            // Formatear fecha de nacimiento de ISO a YYYY-MM-DD
            let formattedDate = "";
            if (userData.fecha_nacimiento) {
              try {
                const date = new Date(userData.fecha_nacimiento);
                formattedDate = date.toISOString().split('T')[0];
              } catch (error) {
                // Ignorar error de formato de fecha
              }
            }

            // Actualizar el formulario con los datos del usuario
            form.reset({
              name: userData.nombre || "",
              apellido: userData.apellido || "",
              email: userData.email || "",
              contrasena: "",
              fecha_nacimiento: formattedDate,
              numero_documento: userData.numero_documento || "",
              tipo_documento: userData.tipo_documento || "CC",
              telefono: userData.telefono || "",
              rol: String(userData.rol) || "4",
            });

            // Inicializar permisos
            initializePermissions((userData.permisos || []) as PermissionItem[]);
          }
        } catch (error) {
          // Manejar error
        } finally {
          setIsLoadingUserData(false);
        }
      } else if (open && !isEditing) {
        // Si estamos creando, resetear formulario
        form.reset({
          name: "",
          apellido: "",
          email: "",
          contrasena: "",
          fecha_nacimiento: "",
          numero_documento: "",
          tipo_documento: "CC",
          telefono: "",
          rol: "4",
        });
        // Inicializar permisos vacíos para creación
        initializePermissions([]);
      }
    };

    loadUserData();
  }, [open, isEditing, user?.id, form]);

  return {
    permissions,
    setPermissions,
    isLoadingUserData,
    initializePermissions
  };
}
