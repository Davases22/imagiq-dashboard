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
import { User, UpdatePermissionsPayload } from "@/types/users";
import { UserPermissionsModal } from "./user-permissions-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  Key,
  Save,
  X,
  ArrowRight
} from "lucide-react";

const userFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
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

  const title = isEditing ? "Editar Usuario" : step === 1 ? "Crear Nuevo Usuario - Paso 1" : "Crear Nuevo Usuario - Paso 2";
  const description = isEditing
    ? "Modifica la información y permisos del usuario."
    : step === 1
      ? "Completa la información básica para crear un nuevo usuario."
      : "Asigna permisos al usuario creado.";

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

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setStep(1);
      setCreatedUserId(null);
      setCreatedUserName("");
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: UserFormValues) => {
    if (isEditing) {
      // Si estamos editando, comportamiento original
      await onSave(values);
      form.reset();
      onClose();
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

  // Renderizar paso 1 o edición
  if (isEditing || step === 1) {
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

                    {!isEditing && (
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
                    )}

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
            <Button onClick={form.handleSubmit(onSubmit)}>
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Crear y Continuar
                </>
              )}
            </Button>
          </DialogFooter>
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
      currentPermissions={[]}
      onSave={handlePermissionsSave}
    />
  );
}