"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { faqEndpoints } from "@/lib/api";
import { Loader2 } from "lucide-react";

const faqFormSchema = z.object({
  pregunta: z.string().min(5, {
    message: "La pregunta debe tener al menos 5 caracteres.",
  }),
  respuesta: z.string().min(10, {
    message: "La respuesta debe tener al menos 10 caracteres.",
  }),
  activo: z.boolean(),
});

type FaqFormValues = z.infer<typeof faqFormSchema>;

interface FaqFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faqId: string | null;
  onSuccess: () => void;
}

export function FaqFormDialog({
  open,
  onOpenChange,
  faqId,
  onSuccess,
}: FaqFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      pregunta: "",
      respuesta: "",
      activo: true,
    },
  });

  // Cargar datos del FAQ si estamos editando
  React.useEffect(() => {
    if (open && faqId) {
      setIsLoadingData(true);
      faqEndpoints
        .getOne(faqId)
        .then((response) => {
          if (response.success && response.data) {
            form.reset({
              pregunta: response.data.pregunta,
              respuesta: response.data.respuesta,
              activo: response.data.activo,
            });
          }
        })
        .catch((error) => {
          toast.error("Error al cargar el FAQ");
          console.error(error);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (open && !faqId) {
      // Resetear formulario cuando es creación
      form.reset({
        pregunta: "",
        respuesta: "",
        activo: true,
      });
    }
  }, [open, faqId, form]);

  const onSubmit = async (data: FaqFormValues) => {
    setIsLoading(true);

    try {
      let response;

      if (faqId) {
        // Actualizar FAQ existente
        response = await faqEndpoints.update(faqId, data);
      } else {
        // Crear nuevo FAQ
        response = await faqEndpoints.create(data);
      }

      if (response.success) {
        toast.success(faqId ? "FAQ actualizado exitosamente" : "FAQ creado exitosamente");
        form.reset();
        onSuccess();
      } else {
        toast.error(response.message || "Error al guardar el FAQ");
      }
    } catch (error) {
      toast.error("Error al guardar el FAQ");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{faqId ? "Editar FAQ" : "Crear nuevo FAQ"}</DialogTitle>
          <DialogDescription>
            {faqId
              ? "Modifica los datos del FAQ existente."
              : "Completa el formulario para agregar una nueva pregunta frecuente."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pregunta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pregunta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="¿Cuál es la pregunta frecuente?"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      La pregunta que verán tus clientes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respuesta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respuesta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe la respuesta detallada..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Proporciona una respuesta clara y completa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado</FormLabel>
                      <FormDescription>
                        ¿Este FAQ debe ser visible para los clientes?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {faqId ? "Actualizar" : "Crear"} FAQ
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
