"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  MousePointerClick,
  Send,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  productNotificationEndpoints,
  ResultadoEnvioAvisos,
  SolicitudAviso,
} from "@/lib/api";

function fecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy, HH:mm", { locale: es });
}

/** Celda de telemetría: una marca con la hora, o un guion si no pasó. */
function Hito({
  activo,
  cuando,
  veces,
}: {
  activo: boolean;
  cuando: string | null;
  veces?: number;
}) {
  if (!activo) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="text-sm">
      <div className="font-medium">{fecha(cuando)}</div>
      {typeof veces === "number" && veces > 1 && (
        <div className="text-xs text-muted-foreground">{veces} veces</div>
      )}
    </div>
  );
}

export default function AvisosDeProductoPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // El nombre llega por query desde la tabla para no pedir el producto otra
  // vez; si alguien entra con la URL pelada, el SKU basta como título.
  const nombreProducto = searchParams.get("nombre") || sku;

  const [solicitudes, setSolicitudes] = useState<SolicitudAviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<ResultadoEnvioAvisos | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await productNotificationEndpoints.getDetail(sku);
      // `res.data` ES el arreglo: el gateway devuelve la lista pelada y el
      // cliente HTTP la mete en su propio `data`.
      const filas = res.success && Array.isArray(res.data) ? res.data : [];
      setSolicitudes(filas);
      setSeleccion(new Set(filas.filter((f) => !f.notificado).map((f) => f.id)));
    } catch {
      toast.error("No se pudieron cargar las solicitudes");
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  }, [sku]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const pendientes = solicitudes.filter((s) => !s.notificado);
    return {
      total: solicitudes.length,
      pendientes: pendientes.length,
      enviados: solicitudes.filter((s) => s.notificado).length,
      entregados: solicitudes.filter((s) => s.entregadoEn).length,
      abiertos: solicitudes.filter((s) => s.abiertoEn).length,
      clics: solicitudes.filter((s) => s.clickEn).length,
      rebotes: solicitudes.filter((s) => s.rebote).length,
      listaPendientes: pendientes,
    };
  }, [solicitudes]);

  const todosMarcados =
    resumen.pendientes > 0 &&
    resumen.listaPendientes.every((p) => seleccion.has(p.id));

  const alternar = (id: string) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const alternarTodos = () =>
    setSeleccion(
      todosMarcados
        ? new Set()
        : new Set(resumen.listaPendientes.map((p) => p.id)),
    );

  const enviar = async (prueba: boolean) => {
    setEnviando(true);
    setResultado(null);
    try {
      const res = await productNotificationEndpoints.send(
        prueba
          ? { sku, pruebaA: user?.email }
          : { sku, ids: Array.from(seleccion) },
      );
      if (!res.success || !res.data) {
        toast.error(res.message || "El envío falló");
        return;
      }
      const r = res.data;
      setResultado(r);

      if (prueba) {
        toast.success(`Prueba enviada a ${user?.email}`);
      } else if (r.fallidos === 0) {
        toast.success(
          `${r.enviados} correo${r.enviados === 1 ? "" : "s"} enviado${r.enviados === 1 ? "" : "s"}`,
        );
      } else {
        toast.warning(`${r.enviados} enviados, ${r.fallidos} fallaron`);
      }

      if (!prueba) await cargar();
    } catch {
      toast.error("No se pudo completar el envío");
    } finally {
      setEnviando(false);
    }
  };

  const metricas: Array<{
    etiqueta: string;
    valor: number;
    icono: React.ReactNode;
    nota?: string;
  }> = [
    { etiqueta: "Solicitudes", valor: resumen.total, icono: <UserRound className="h-4 w-4" /> },
    { etiqueta: "Por enviar", valor: resumen.pendientes, icono: <Mail className="h-4 w-4" /> },
    { etiqueta: "Enviados", valor: resumen.enviados, icono: <Send className="h-4 w-4" /> },
    { etiqueta: "Entregados", valor: resumen.entregados, icono: <Truck className="h-4 w-4" /> },
    {
      etiqueta: "Abiertos",
      valor: resumen.abiertos,
      icono: <CheckCircle2 className="h-4 w-4" />,
      nota: "Aproximado: se mide con un pixel que Gmail cachea y que Apple Mail dispara solo. Úsalo como tendencia, no como dato duro.",
    },
    { etiqueta: "Clics", valor: resumen.clics, icono: <MousePointerClick className="h-4 w-4" /> },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/productos/notificaciones")}
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {nombreProducto}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">{sku}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metricas.map((m) => (
            <Card key={m.etiqueta}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {m.nota ? (
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                        {m.etiqueta}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {m.nota}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    m.etiqueta
                  )}
                </CardTitle>
                <span className="text-muted-foreground">{m.icono}</span>
              </CardHeader>
              <CardContent>
                {cargando ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{m.valor}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {resumen.rebotes > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {resumen.rebotes} correo{resumen.rebotes === 1 ? "" : "s"} rebotó o
            fue marcado como spam. Revisa la columna de rebote.
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Correos asociados</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={enviando || solicitudes.length === 0 || !user?.email}
                onClick={() => void enviar(true)}
                title={
                  user?.email
                    ? `Se enviará solo a ${user.email}`
                    : "Sin correo en la sesión"
                }
              >
                {enviando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviarme una prueba
              </Button>
              <Button
                size="sm"
                disabled={enviando || seleccion.size === 0}
                onClick={() => void enviar(false)}
              >
                {enviando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar a {seleccion.size}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {cargando ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : solicitudes.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Nadie ha pedido aviso para este producto.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={todosMarcados}
                          onCheckedChange={alternarTodos}
                          disabled={resumen.pendientes === 0}
                          aria-label="Seleccionar todos los pendientes"
                        />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="w-44">Lo pidió</TableHead>
                      <TableHead className="w-44">Enviado</TableHead>
                      <TableHead className="w-44">Entregado</TableHead>
                      <TableHead className="w-44">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                            Abierto
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Aproximado. Gmail cachea el pixel y Apple Mail lo
                            dispara solo aunque nadie abra el correo.
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-44">Clic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitudes.map((s) => (
                      <TableRow
                        key={s.id}
                        className={s.rebote ? "bg-destructive/5" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={seleccion.has(s.id)}
                            onCheckedChange={() => alternar(s.id)}
                            disabled={s.notificado || enviando}
                            aria-label={`Seleccionar ${s.email}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{s.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.nombre ?? "Sin cuenta — saludo neutro"}
                          </div>
                          {s.rebote && (
                            <Badge variant="destructive" className="mt-1">
                              {s.rebote === "Complaint"
                                ? "Marcado como spam"
                                : "Rebotó"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fecha(s.creadoEn)}
                        </TableCell>
                        <TableCell>
                          {s.notificado ? (
                            <div className="text-sm">
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-600"
                              >
                                Sí
                              </Badge>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {fecha(s.notificadoEn)}
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-orange-500 text-orange-600"
                            >
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Hito activo={Boolean(s.entregadoEn)} cuando={s.entregadoEn} />
                        </TableCell>
                        <TableCell>
                          <Hito
                            activo={Boolean(s.abiertoEn)}
                            cuando={s.abiertoEn}
                            veces={s.aperturas}
                          />
                        </TableCell>
                        <TableCell>
                          <Hito
                            activo={Boolean(s.clickEn)}
                            cuando={s.clickEn}
                            veces={s.clics}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {resultado && resultado.fallidos > 0 && (
              <div className="mt-4 rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                <div className="mb-1 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {resultado.fallidos} no se pudieron enviar
                </div>
                <ul className="ml-6 list-disc text-muted-foreground">
                  {resultado.detalle
                    .filter((d) => !d.ok)
                    .slice(0, 5)
                    .map((d) => (
                      <li key={d.email}>
                        {d.email} — {d.error}
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Siguen pendientes: puedes reintentar sin duplicarle el correo a
                  nadie.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
