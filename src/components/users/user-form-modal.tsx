"use client";

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
import { User } from "@/types/users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  Key,
  Save,
  X
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
  role: z.enum(["super_admin", "admin", "manager", "editor", "viewer"]),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  twoFactorEnabled: z.boolean(),
  customPermissions: z.array(z.string()).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (user: UserFormValues) => void;
}

export function UserFormModal({ open, onClose, user, onSave }: UserFormModalProps) {
  const isEditing = !!user;
  const title = isEditing ? "Editar Usuario" : "Crear Nuevo Usuario";
  const description = isEditing
    ? "Modifica la información y permisos del usuario."
    : "Completa la información para crear un nuevo usuario.";

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
      //role: user?.role || "viewer",
      status: user?.status || "pending",
      department: user?.department || "",
      phoneNumber: user?.phoneNumber || "",
      location: user?.location || "",
      timezone: user?.timezone || "Europe/Madrid",
      twoFactorEnabled: user?.twoFactorEnabled || false,
      customPermissions: user?.permissions || [],
    },
  });

  const onSubmit = (values: UserFormValues) => {
    onSave(values);
    onClose();
  };

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
                            <Input placeholder="+57 300 123 4567" className="pl-9" {...field} />
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
                            <SelectItem value="1">Super Admin</SelectItem>
                            <SelectItem value="2">Invitado</SelectItem>
                            <SelectItem value="3">Invitado</SelectItem>
                            <SelectItem value="4">Admin</SelectItem>
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
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}