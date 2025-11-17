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
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, UpdatePermissionsPayload, PermissionAction, PermissionResource } from "@/types/users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  X,
  ArrowRight,
  ArrowLeft,
  Shield,
  Save,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserFormStep1 } from "./user-form-step1";
import { UserFormStep2 } from "./user-form-step2";
import { useUserFormData } from "./hooks/useUserFormData";

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

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      apellido: "",
      email: "",
      contrasena: "",
      fecha_nacimiento: "",
      numero_documento: "",
      tipo_documento: "CC",
      telefono: "",
      rol: "4",
    },
  });

  const { permissions, setPermissions, isLoadingUserData } = useUserFormData(open, user, form);

  // Titles and descriptions
  const title = isEditing
    ? (step === 1 ? "Editar Usuario - Paso 1" : "Editar Usuario - Paso 2")
    : (step === 1 ? "Crear Nuevo Usuario - Paso 1" : "Crear Nuevo Usuario - Paso 2");

  const description = isEditing
    ? (step === 1 ? "Modifica la información básica del usuario." : "Modifica los permisos del usuario.")
    : (step === 1 ? "Completa la información básica para crear un nuevo usuario." : "Asigna permisos al usuario creado.");

  // Permission handlers
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
        p.recurso === recurso ? { ...p, permitido } : p
      )
    );
  };

  // Form submission
  const onSubmit = async (values: UserFormValues) => {
    if (isEditing) {
      const result = await onSave(values);
      if (result.success && user?.id) {
        setCreatedUserId(user.id);
        setCreatedUserName(`${values.name} ${values.apellido}`);
        setStep(2);
      }
    } else {
      const result = await onSave(values);
      if (result.success && result.userId) {
        setCreatedUserId(result.userId);
        setCreatedUserName(`${values.name} ${values.apellido}`);
        setStep(2);
      }
    }
  };

  const handlePermissionsSave = async () => {
    if (onSavePermissions && createdUserId) {
      const payload: UpdatePermissionsPayload = {
        userId: createdUserId,
        permisos: permissions
      };
      await onSavePermissions(payload);
    }
    // Reset and close
    form.reset();
    setStep(1);
    setCreatedUserId(null);
    setCreatedUserName("");
    setPermissions([]);
    onClose();
  };

  const handleBack = () => setStep(1);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setCreatedUserId(null);
      setCreatedUserName("");
      setPermissions([]);
      form.reset();
    }
  }, [open, form]);

  // Render Step 1
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[60vh] pr-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <UserFormStep1 form={form} isEditing={isEditing} />
                  </form>
                </Form>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoadingUserData}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {isEditing ? "Guardar y Continuar" : "Crear y Continuar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Render Step 2
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <UserFormStep2
          permissions={permissions}
          onPermissionToggle={handlePermissionToggle}
          onSelectAllForResource={handleSelectAllForResource}
        />

        <DialogFooter>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={handlePermissionsSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
