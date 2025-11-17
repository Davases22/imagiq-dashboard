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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, UpdatePermissionsPayload, PermissionItem } from "@/types/users";
import { UserPermissionsModal } from "./user-permissions-modal";
import { userEndpoints } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  Key,
  X,
  ArrowRight,
  Loader2
} from "lucide-react";
import { is } from "date-fns/locale";

const userFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  contrasena: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  numero_documento: z.string().optional(),
  tipo_documento: z.string().optional(),
  telefono: z.string().optional(),
  rol: z.string().min(1, "El rol es requerido"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (user: UserFormValues) => Promise<{ success: boolean; userId?: string }>;
  onSavePermissions?: (payload: UpdatePermissionsPayload) => Promise<void>;
}

export function UserFormModal({ open, onClose, user, onSave, onSavePermissions }: UserFormModalProps) {
  const isEditing = !!user;
  const [step, setStep] = useState<1 | 2>(1);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdUserName, setCreatedUserName] = useState<string>("");
  const [currentPermissions, setCurrentPermissions] = useState<PermissionItem[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const title = isEditing
    ? (step === 1 ? "Editar Usuario - Paso 1" : "Editar Usuario - Paso 2")
    : (step === 1 ? "Crear Nuevo Usuario - Paso 1" : "Crear Nuevo Usuario - Paso 2");
  const description = isEditing
    ? (step === 1
        ? "Modifica la información básica del usuario."
        : "Modifica los permisos del usuario.")
    : (step === 1
        ? "Completa la información básica para crear un nuevo usuario."
        : "Asigna permisos al usuario creado.");

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      apellido: "",
      email: user?.email || "",
      contrasena: "",
      fecha_nacimiento: "",
      numero_documento: "",
      tipo_documento: "CC",
      telefono: "",
      rol: "4",
    },
  });

  // Cargar datos del usuario cuando se abre el modal en modo edición
  useEffect(() => {
    const loadUserData = async () => {
      if (open && isEditing && user?.id) {
      
        setIsLoadingUserData(true);
        setStep(1); // Asegurarnos de empezar en el paso 1
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
            // Guardar permisos actuales
            setCurrentPermissions((userData.permisos || []) as PermissionItem[]);
          }
        } catch (error) {
          
        } finally {
          setIsLoadingUserData(false);
        }
      } else if (open && !isEditing) {
        // Si estamos creando, asegurarnos de empezar en el paso 1
        setStep(1);
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
      }
    };

    loadUserData();
  }, [open, isEditing, user?.id, form]);

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setStep(1);
      setCreatedUserId(null);
      setCreatedUserName("");
      setCurrentPermissions([]);
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: UserFormValues) => {
    
    if (isEditing) {
      // Si estamos editando en el paso 1, guardamos y pasamos al paso 2
      const result = await onSave(values);
      if (result.success && user?.id) {
        setCreatedUserId(user.id);
        setCreatedUserName(`${values.name} ${values.apellido}`);
        setStep(2);
      }
    } else {
      // Si estamos creando, guardamos el usuario y pasamos al paso 2
      const result = await onSave(values);
      if (result.success && result.userId) {
        setCreatedUserId(result.userId);
        setCreatedUserName(`${values.name} ${values.apellido}`);
        setStep(2);
      }
    }
  };

  const handlePermissionsSave = async (payload: UpdatePermissionsPayload) => {
    if (onSavePermissions) {
      await onSavePermissions(payload);
    }
    // Cerrar el modal completo después de guardar permisos
    form.reset();
    setStep(1);
    setCreatedUserId(null);
    setCreatedUserName("");
    onClose();
  };

  const handlePermissionsClose = () => {
    // Cerrar sin guardar permisos
    form.reset();
    setStep(1);
    setCreatedUserId(null);
    setCreatedUserName("");
    onClose();
  };

  // Renderizar paso 1 (info básica)
  if (step === 1) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {isLoadingUserData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[60vh] pr-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nombre del usuario" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Apellido del usuario" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="usuario@ejemplo.com"
                                className="pl-9"
                                {...field}
                                disabled={isEditing}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                     
                      <FormField
                        control={form.control}
                        name="contrasena"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="Contraseña"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    

                    <FormField
                      control={form.control}
                      name="fecha_nacimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipo_documento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo Documento</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[10000]">
                                <SelectItem value="CC">CC</SelectItem>
                                <SelectItem value="TI">TI</SelectItem>
                                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numero_documento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Documento</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="3001234567" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="1">Admin</SelectItem>
                              <SelectItem value="2">Usuario</SelectItem>
                              <SelectItem value="3">Invitado</SelectItem>
                              <SelectItem value="4">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    </div>
                  </form>
                </Form>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoadingUserData}>
                  {isEditing ? (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Guardar y Continuar
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Crear y Continuar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Renderizar paso 2 - Modal de permisos
  return (
    <UserPermissionsModal
      open={open && step === 2}
      onClose={handlePermissionsClose}
      userId={createdUserId || ""}
      userName={createdUserName}
      currentPermissions={isEditing ? currentPermissions : []}
      onSave={handlePermissionsSave}
    />
  );
}