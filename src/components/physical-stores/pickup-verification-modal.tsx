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
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, CheckCircle, XCircle, Key, IdCard, Hash } from "lucide-react";
import { toast } from "sonner";
import {
  useVerifyPickup,
  VerifyPickupResponse,
} from "@/hooks/use-verify-pickup";

const verificationFormSchema = z.object({
  serialId: z.string().min(1, "Número de orden requerido"),
  token: z.string().min(1, "Código de verificación requerido"),
  numeroDocumento: z.string().min(1, "Número de documento requerido"),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

interface PickupVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerificationSuccess?: (data: VerifyPickupResponse) => void;
}

const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    APPROVED: "Aprobada",
    PENDING: "Pendiente",
    CANCELLED: "Cancelada",
    DELIVERED: "Entregada",
  };
  return labels[estado] || estado;
};

const getMetodoEnvioLabel = (metodo: number) => {
  const labels: Record<number, string> = {
    1: "Domicilio",
    2: "Recogida en Tienda",
  };
  return labels[metodo] || `Método ${metodo}`;
};

export function PickupVerificationModal({
  open,
  onClose,
  onVerificationSuccess,
}: PickupVerificationModalProps) {
  const { verify, isLoading, result, reset } = useVerifyPickup();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      serialId: "",
      token: "",
      numeroDocumento: "",
    },
  });

  const onSubmit = async (values: VerificationFormValues) => {
    const serialIdNumber = Number.parseInt(values.serialId, 10);

    if (Number.isNaN(serialIdNumber)) {
      toast.error("El número de orden debe ser un número válido");
      return;
    }

    const response = await verify(
      serialIdNumber,
      values.numeroDocumento,
      values.token
    );

    if (response.valid) {
      toast.success("Verificación exitosa - Orden válida para recogida");
      onVerificationSuccess?.(response);
    } else {
      toast.error(response.message);
    }
  };

  const handleClose = () => {
    form.reset();
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Verificación de Recogida
          </DialogTitle>
          <DialogDescription>
            Verificar si una orden está lista para ser recogida en tienda
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="serialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Orden</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="12345"
                          className="pl-9"
                          type="number"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      ID serial de la orden del cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Verificación</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ABC123XYZ"
                          className="pl-9 font-mono uppercase"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Token único de verificación del cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="1234567890"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Documento de identidad del cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Verification Result */}
            {result && (
              <Card
                className={
                  result.valid
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2">
                    {result.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span
                      className={`font-medium text-sm ${
                        result.valid
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {result.message}
                    </span>
                  </div>

                  {result.valid && result.data && (
                    <div className="space-y-2 pt-3 mt-3 border-t border-green-500/30">
                      <h4 className="font-medium text-sm">
                        Detalles de la Orden
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Serial ID:
                          </span>
                          <div className="font-medium font-mono">
                            #{result.data.serialId}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estado:</span>
                          <div className="font-medium">
                            {getEstadoLabel(result.data.estado)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Método de Envío:
                          </span>
                          <div className="font-medium">
                            {getMetodoEnvioLabel(result.data.metodoEnvio)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Documento:
                          </span>
                          <div className="font-medium">
                            {result.data.numeroDocumento}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Token Usado:
                          </span>
                          <div className="font-medium">
                            {result.data.tokenUsado ? "Sí" : "No"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            ID Recogida:
                          </span>
                          <div className="font-medium font-mono text-xs">
                            {result.data.recogidaId.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verificar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
