"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Monitor,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  AlertCircle,
  KeyRound,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  BackendTienda,
  kioskAdminEndpoints,
  KioskAccountStatus,
} from "@/lib/api";

interface KioskAccountDialogProps {
  open: boolean;
  onClose: () => void;
  store: BackendTienda | null;
}

export function KioskAccountDialog({
  open,
  onClose,
  store,
}: KioskAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountStatus, setAccountStatus] =
    useState<KioskAccountStatus | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const checkAccount = useCallback(async () => {
    if (!store?.email) return;
    setIsLoading(true);
    setError("");
    try {
      const { data } = await kioskAdminEndpoints.checkAccount(store.email);
      setAccountStatus(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al verificar cuenta"
      );
    } finally {
      setIsLoading(false);
    }
  }, [store?.email]);

  useEffect(() => {
    if (open && store?.email) {
      checkAccount();
    } else {
      setAccountStatus(null);
      setPassword("");
      setError("");
      setShowPassword(false);
      setShowResetForm(false);
      setConfirmDelete(false);
    }
  }, [open, store?.email, checkAccount]);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  const copyPassword = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    toast.success("Contraseña copiada al portapapeles");
  };

  const handleCreate = async () => {
    if (!store?.email || !password) return;
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setIsCreating(true);
    setError("");
    try {
      await kioskAdminEndpoints.createAccount(store.email, password);
      toast.success(
        `Cuenta de quiosco creada para ${store.descripcion || store.codBodega}`
      );
      setPassword("");
      await checkAccount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear cuenta"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!accountStatus?.store?.email || !password) return;
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setIsResetting(true);
    setError("");
    try {
      await kioskAdminEndpoints.resetPassword(
        accountStatus.store.email,
        password,
      );
      toast.success("Contraseña actualizada correctamente");
      setPassword("");
      setShowPassword(false);
      setShowResetForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cambiar contraseña"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountStatus?.store?.email) return;
    setIsDeleting(true);
    setError("");
    try {
      await kioskAdminEndpoints.deleteAccount(accountStatus.store.email);
      toast.success("Cuenta de quiosco eliminada");
      setConfirmDelete(false);
      await checkAccount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar cuenta"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Nunca";
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Cuenta de Quiosco
          </DialogTitle>
          <DialogDescription>
            {store?.descripcion || store?.codBodega || "Tienda"}
            {store?.codBodega && (
              <span className="ml-2 font-mono text-xs">
                (Cod. {store.codBodega})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Sin email */}
        {!store?.email && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              Esta tienda no tiene email configurado
            </span>
          </div>
        )}

        {/* Cargando */}
        {store?.email && isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Cuenta existe */}
        {store?.email && !isLoading && accountStatus?.exists && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Cuenta activa</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{accountStatus.store?.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Código</span>
                <p className="font-medium font-mono">
                  {accountStatus.store?.codigo}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Cod. Bodega</span>
                <p className="font-medium font-mono">
                  {accountStatus.store?.cod_bodega}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado</span>
                <p className="font-medium">
                  {accountStatus.activo ? (
                    <span className="text-green-600">Activa</span>
                  ) : (
                    <span className="text-red-600">Inactiva</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Último login</span>
                <p className="font-medium">
                  {formatDate(accountStatus.ultimo_login)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Creada</span>
                <p className="font-medium">
                  {formatDate(accountStatus.fecha_creacion)}
                </p>
              </div>
            </div>

            {/* Toggle OTP */}
            <div className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div>
                <Label htmlFor="otp-toggle" className="text-sm font-medium">
                  Requiere OTP
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si está activo, la tienda necesita verificación OTP
                </p>
              </div>
              <Switch
                id="otp-toggle"
                className="data-[state=checked]:bg-green-500"
                checked={accountStatus.requiere_otp ?? true}
                onCheckedChange={async (checked) => {
                  try {
                    await kioskAdminEndpoints.toggleOtp(
                      accountStatus.store!.email,
                      checked,
                    );
                    setAccountStatus({
                      ...accountStatus,
                      requiere_otp: checked,
                    });
                    toast.success(
                      checked
                        ? "OTP activado para esta tienda"
                        : "OTP desactivado para esta tienda",
                    );
                  } catch {
                    toast.error("Error al cambiar configuración de OTP");
                  }
                }}
              />
            </div>

            {/* Cambiar contraseña */}
            {!showResetForm ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowResetForm(true);
                  setConfirmDelete(false);
                  setPassword("");
                  setError("");
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                <input type="text" name="prevent_autofill" id="prevent_autofill" value="" style={{ display: "none" }} tabIndex={-1} autoComplete="username" readOnly />
                <Label className="text-sm font-medium">Nueva Contraseña</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Mín. 8 caracteres"
                      disabled={isResetting}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={generatePassword}
                    disabled={isResetting}
                    title="Generar contraseña"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {password && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      disabled={isResetting}
                      title="Copiar contraseña"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetPassword}
                    disabled={isResetting || !password || password.length < 8}
                    className="flex-1"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Contraseña"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowResetForm(false);
                      setPassword("");
                      setError("");
                    }}
                    disabled={isResetting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Eliminar cuenta */}
            {!confirmDelete ? (
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => {
                  setConfirmDelete(true);
                  setShowResetForm(false);
                  setPassword("");
                  setError("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Cuenta
              </Button>
            ) : (
              <div className="border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  ¿Estás seguro de eliminar esta cuenta de quiosco?
                </p>
                <p className="text-xs text-muted-foreground">
                  Esta acción no se puede deshacer. La tienda perderá acceso al
                  sistema de quioscos.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Sí, Eliminar"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sin cuenta — formulario de creación */}
        {store?.email && !isLoading && accountStatus && !accountStatus.exists && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                No tiene cuenta de quiosco
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{store.email}</span>
            </div>

            <div className="space-y-2">
              <input type="text" name="prevent_autofill_create" value="" style={{ display: "none" }} tabIndex={-1} autoComplete="username" readOnly />
              <Label htmlFor="kiosk-password">Contraseña</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="kiosk-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Mín. 8 caracteres"
                    disabled={isCreating}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generatePassword}
                  disabled={isCreating}
                  title="Generar contraseña"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {password && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    disabled={isCreating}
                    title="Copiar contraseña"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating || !password || password.length < 8}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta de Quiosco"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
