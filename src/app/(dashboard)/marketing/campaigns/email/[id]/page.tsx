"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Ban,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Download,
} from "lucide-react";
import {
  emailCampaignEndpoints,
  EmailCampaignResponse,
  EmailCampaignRecipientResponse,
} from "@/lib/api";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  sending: "Enviando",
  completed: "Completada",
  failed: "Fallida",
  paused: "Pausada",
  scheduled: "Programada",
  cancelled: "Cancelada",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sending: "default",
  completed: "secondary",
  failed: "destructive",
  paused: "outline",
  scheduled: "outline",
  cancelled: "destructive",
};

const recipientStatusLabels: Record<string, string> = {
  queued: "En cola",
  sent: "Enviado",
  delivered: "Entregado",
  opened: "Abierto",
  clicked: "Click",
  bounced: "Rebotado",
  complained: "Queja",
  unsubscribed: "Desuscrito",
};

const recipientStatusColors: Record<string, string> = {
  queued: "bg-zinc-500",
  sent: "bg-blue-500",
  delivered: "bg-green-500",
  opened: "bg-emerald-500",
  clicked: "bg-purple-500",
  bounced: "bg-red-500",
  complained: "bg-orange-500",
  unsubscribed: "bg-yellow-500",
};

export default function EmailCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<EmailCampaignResponse | null>(null);
  const [recipients, setRecipients] = useState<EmailCampaignRecipientResponse[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const RECIPIENTS_PER_PAGE = 20;

  // Fetch campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await emailCampaignEndpoints.getOne(campaignId);
        if (response.success && response.data) {
          setCampaign(response.data as EmailCampaignResponse);
        } else {
          toast.error("No se encontró la campaña");
          router.push("/marketing/campaigns");
        }
      } catch {
        toast.error("Error al cargar la campaña");
        router.push("/marketing/campaigns");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  // Fetch recipients
  useEffect(() => {
    const fetchRecipients = async () => {
      setIsLoadingRecipients(true);
      try {
        const response = await emailCampaignEndpoints.getRecipients(campaignId, {
          page: recipientPage,
          limit: RECIPIENTS_PER_PAGE,
          status: recipientStatusFilter !== "all" ? recipientStatusFilter : undefined,
        });
        if (response.success && response.data) {
          const data = response.data as { data: EmailCampaignRecipientResponse[]; total: number };
          setRecipients(data.data || []);
          setRecipientsTotal(data.total || 0);
        }
      } catch {
        console.error("Error fetching recipients");
      } finally {
        setIsLoadingRecipients(false);
      }
    };
    fetchRecipients();
  }, [campaignId, recipientPage, recipientStatusFilter]);

  // Filter recipients by search locally
  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return recipients;
    const q = recipientSearch.toLowerCase();
    return recipients.filter(
      (r) => r.email.toLowerCase().includes(q) || (r.name && r.name.toLowerCase().includes(q))
    );
  }, [recipients, recipientSearch]);

  const totalPages = Math.ceil(recipientsTotal / RECIPIENTS_PER_PAGE);

  // Export all recipients as CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const allRecipients: EmailCampaignRecipientResponse[] = [];
      let page = 1;
      const batchSize = 500;
      let hasMore = true;

      while (hasMore) {
        const response = await emailCampaignEndpoints.getRecipients(campaignId, {
          page,
          limit: batchSize,
        });
        if (response.success && response.data) {
          const data = response.data as { data: EmailCampaignRecipientResponse[]; total: number };
          allRecipients.push(...(data.data || []));
          hasMore = allRecipients.length < (data.total || 0);
          page++;
        } else {
          hasMore = false;
        }
      }

      // Build CSV
      const headers = ["Email", "Nombre", "Estado", "Enviado", "Aperturas", "Primera apertura", "Clicks", "Rebote", "Tipo rebote", "Error"];
      const rows = allRecipients.map((r) => [
        r.email,
        r.name || "",
        recipientStatusLabels[r.status] || r.status,
        r.sentAt ? new Date(r.sentAt).toLocaleString("es-CO") : "",
        r.openCount.toString(),
        r.firstOpenedAt ? new Date(r.firstOpenedAt).toLocaleString("es-CO") : "",
        r.clickCount.toString(),
        r.bouncedAt ? new Date(r.bouncedAt).toLocaleString("es-CO") : "",
        r.bounceType || "",
        r.errorMessage || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaña-${campaign?.name || campaignId}-destinatarios.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${allRecipients.length.toLocaleString()} destinatarios exportados`);
    } catch {
      toast.error("Error al exportar destinatarios");
    } finally {
      setIsExporting(false);
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    if (!campaign) return null;
    const total = campaign.totalRecipients || 0;
    const sent = campaign.successfulSends || 0;
    const failed = campaign.failedSends || 0;
    const opens = campaign.openCount || campaign.uniqueOpens || 0;
    const clicks = campaign.clickCount || campaign.uniqueClicks || 0;
    const bounces = campaign.bounceCount || 0;
    const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(1) : "0";
    const clickRate = sent > 0 ? ((clicks / sent) * 100).toFixed(1) : "0";
    const bounceRate = total > 0 ? ((bounces / total) * 100).toFixed(1) : "0";
    return { total, sent, failed, opens, clicks, bounces, openRate, clickRate, bounceRate };
  }, [campaign]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign || !stats) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("es-CO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/marketing/campaigns")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight truncate">{campaign.name}</h1>
            <Badge variant={statusVariants[campaign.status] || "outline"}>
              {campaign.status === "sending" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {statusLabels[campaign.status] || campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8">
            <span>Asunto: <span className="text-foreground">{campaign.subject}</span></span>
            <span>Creada: {formatDate(campaign.createdAt)}</span>
            {campaign.sentAt && <span>Enviada: {formatDate(campaign.sentAt)}</span>}
            {campaign.completedAt && <span>Completada: {formatDate(campaign.completedAt)}</span>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Destinatarios</span>
            </div>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Enviados</span>
            </div>
            <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${((stats.sent / stats.total) * 100).toFixed(0)}%` : "0%"} del total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Abiertos</span>
            </div>
            <div className="text-2xl font-bold">{stats.opens.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{stats.openRate}% tasa de apertura</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
            <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{stats.clickRate}% CTR</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Fallidos</span>
            </div>
            <div className="text-2xl font-bold">{stats.failed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Rebotes</span>
            </div>
            <div className="text-2xl font-bold">{stats.bounces.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{stats.bounceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Destinatarios</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar email..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-8 h-9 w-[200px]"
                />
              </div>
              <Select
                value={recipientStatusFilter}
                onValueChange={(v) => { setRecipientStatusFilter(v); setRecipientPage(1); }}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="queued">En cola</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="opened">Abierto</SelectItem>
                  <SelectItem value="clicked">Click</SelectItem>
                  <SelectItem value="bounced">Rebotado</SelectItem>
                  <SelectItem value="complained">Queja</SelectItem>
                  <SelectItem value="unsubscribed">Desuscrito</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={handleExportCsv}
                disabled={isExporting || recipientsTotal === 0}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingRecipients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron destinatarios
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="text-center">Aperturas</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead>Última actividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{r.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${recipientStatusColors[r.status] || "bg-zinc-500"}`} />
                          <span className="text-sm">{recipientStatusLabels[r.status] || r.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatShortDate(r.sentAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.openCount > 0 ? (
                          <span className="text-sm font-medium text-emerald-500">{r.openCount}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.clickCount > 0 ? (
                          <span className="text-sm font-medium text-purple-500">{r.clickCount}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.lastOpenedAt
                          ? formatShortDate(r.lastOpenedAt)
                          : r.firstClickedAt
                          ? formatShortDate(r.firstClickedAt)
                          : r.bouncedAt
                          ? formatShortDate(r.bouncedAt)
                          : r.deliveredAt
                          ? formatShortDate(r.deliveredAt)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {recipientsTotal.toLocaleString()} destinatario{recipientsTotal !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                    disabled={recipientPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {recipientPage} de {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecipientPage((p) => Math.min(totalPages, p + 1))}
                    disabled={recipientPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
