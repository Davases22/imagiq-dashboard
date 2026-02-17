"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";

// ============ Types ============

export interface ParsedRecipient {
  email?: string;
  phoneNumber?: string;
  name?: string;
  rawData?: Record<string, string>;
}

export interface CsvStats {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  detectedFormat: "full_template" | "simple";
}

interface CsvRow {
  data: Record<string, string>;
  rowIndex: number;
  isValid: boolean;
  error?: string;
  isDuplicate: boolean;
}

interface CsvUploaderProps {
  mode: "email" | "sms";
  onRecipientsReady: (recipients: ParsedRecipient[]) => void;
  onStatsChange: (stats: CsvStats | null) => void;
}

// ============ Column mapping ============

const EMAIL_HEADERS = ["email", "correo", "e-mail", "e_mail", "mail"];
const PHONE_HEADERS = ["phone", "telefono", "celular", "movil", "mobile", "tel"];
const NAME_HEADERS = ["name", "nombre", "razon_social", "nombre_completo", "razonsocial"];
const LASTNAME_HEADERS = ["apellido", "last_name", "lastname"];
const INDICATIVO_HEADERS = ["indicativo", "cod_pais", "country_code", "codigo_pais"];
const FULL_TEMPLATE_MARKERS = ["id_cliente", "razon_social"];

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, "_");
}

function findColumn(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    if (candidates.includes(normalizeHeader(h))) return h;
  }
  return null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

// ============ Component ============

export function CsvUploader({ mode, onRecipientsReady, onStatsChange }: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [stats, setStats] = useState<CsvStats | null>(null);
  const [columnMap, setColumnMap] = useState<{
    email?: string;
    phone?: string;
    name?: string;
    lastname?: string;
    indicativo?: string;
    format: "full_template" | "simple";
  } | null>(null);

  const reset = useCallback(() => {
    setRows([]);
    setStats(null);
    setColumnMap(null);
    onRecipientsReady([]);
    onStatsChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onRecipientsReady, onStatsChange]);

  const processFile = useCallback(
    (file: File) => {
      setIsParsing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          const headers = results.meta.fields || [];
          const data = results.data as Record<string, string>[];

          // Detect format
          const isFullTemplate = headers.some((h) =>
            FULL_TEMPLATE_MARKERS.includes(normalizeHeader(h))
          );

          // Map columns
          const emailCol = findColumn(headers, EMAIL_HEADERS);
          const phoneCol = findColumn(headers, PHONE_HEADERS);
          const nameCol = findColumn(headers, NAME_HEADERS);
          const lastnameCol = findColumn(headers, LASTNAME_HEADERS);
          const indicativoCol = findColumn(headers, INDICATIVO_HEADERS);

          const map = {
            email: emailCol || undefined,
            phone: phoneCol || undefined,
            name: nameCol || undefined,
            lastname: lastnameCol || undefined,
            indicativo: indicativoCol || undefined,
            format: isFullTemplate ? ("full_template" as const) : ("simple" as const),
          };
          setColumnMap(map);

          // Validate each row
          const seenKeys = new Set<string>();
          let duplicateCount = 0;

          const processedRows: CsvRow[] = data.map((row, index) => {
            let isValid = true;
            let error: string | undefined;
            let isDuplicate = false;

            if (mode === "email") {
              const email = (map.email ? row[map.email] : "")?.trim().toLowerCase();
              if (!email) {
                isValid = false;
                error = "Email vacío";
              } else if (!validateEmail(email)) {
                isValid = false;
                error = `Email inválido: ${email}`;
              } else if (seenKeys.has(email)) {
                isDuplicate = true;
                duplicateCount++;
              } else {
                seenKeys.add(email);
              }
            } else {
              // SMS mode
              let phone = "";
              if (map.indicativo && map.phone) {
                const ind = (row[map.indicativo] || "").replace(/\D/g, "");
                const mov = (row[map.phone] || "").replace(/\D/g, "");
                phone = ind + mov;
              } else if (map.phone) {
                phone = (row[map.phone] || "").replace(/\D/g, "");
              }

              if (!phone) {
                isValid = false;
                error = "Teléfono vacío";
              } else if (!validatePhone(phone)) {
                isValid = false;
                error = `Teléfono inválido: ${phone}`;
              } else if (seenKeys.has(phone)) {
                isDuplicate = true;
                duplicateCount++;
              } else {
                seenKeys.add(phone);
              }
            }

            return { data: row, rowIndex: index + 1, isValid, error, isDuplicate };
          });

          setRows(processedRows);

          const validRows = processedRows.filter((r) => r.isValid && !r.isDuplicate);
          const invalidRows = processedRows.filter((r) => !r.isValid);

          const csvStats: CsvStats = {
            filename: file.name,
            totalRows: processedRows.length,
            validRows: validRows.length,
            invalidRows: invalidRows.length,
            duplicateRows: duplicateCount,
            detectedFormat: map.format,
          };

          setStats(csvStats);
          onStatsChange(csvStats);

          // Build recipients from valid, non-duplicate rows
          const recipients: ParsedRecipient[] = validRows.map((r) => {
            const recipient: ParsedRecipient = {};

            if (mode === "email" && map.email) {
              recipient.email = r.data[map.email]?.trim().toLowerCase();
            }

            if (mode === "sms") {
              if (map.indicativo && map.phone) {
                const ind = (r.data[map.indicativo] || "").replace(/\D/g, "");
                const mov = (r.data[map.phone] || "").replace(/\D/g, "");
                recipient.phoneNumber = ind + mov;
              } else if (map.phone) {
                recipient.phoneNumber = (r.data[map.phone] || "").replace(/\D/g, "");
              }
            }

            if (map.name) {
              recipient.name = r.data[map.name]?.trim();
            }

            // Store full raw data for audit
            if (isFullTemplate) {
              recipient.rawData = { ...r.data };
            }

            return recipient;
          });

          onRecipientsReady(recipients);
          setIsParsing(false);
        },
        error: (error) => {
          console.error("CSV parse error:", error);
          setIsParsing(false);
        },
      });
    },
    [mode, onRecipientsReady, onStatsChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      processFile(file);
    }
  };

  const downloadErrors = () => {
    const errorRows = rows.filter((r) => !r.isValid);
    if (errorRows.length === 0) return;

    const headers = Object.keys(errorRows[0].data);
    const csvContent = [
      [...headers, "error_fila", "error_motivo"].join(","),
      ...errorRows.map((r) =>
        [
          ...headers.map((h) => `"${(r.data[h] || "").replace(/"/g, '""')}"`),
          r.rowIndex,
          `"${r.error || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `errores-csv-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============ Render ============

  // No file uploaded yet - show dropzone
  if (!stats) {
    return (
      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Procesando CSV...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Arrastra tu archivo CSV aquí</p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz clic para seleccionar
                </p>
              </div>
              <Badge variant="outline" className="mt-2">
                .csv o .txt
              </Badge>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Formatos soportados:</p>
          {mode === "email" ? (
            <>
              <p>Plantilla completa: id_cliente, razon_social, e_mail, movil, indicativo, ...</p>
              <p>Formato simple: email, nombre</p>
            </>
          ) : (
            <>
              <p>Plantilla completa: id_cliente, razon_social, e_mail, movil, indicativo, ...</p>
              <p>Formato simple: telefono, nombre, apellido</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // File uploaded - show stats + preview
  const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);
  const invalidRows = rows.filter((r) => !r.isValid);
  const duplicateRows = rows.filter((r) => r.isDuplicate);
  const previewRows = rows.slice(0, 5);

  // Determine which columns to show in preview
  const previewCols: { key: string; label: string }[] = [];
  if (mode === "email" && columnMap?.email) {
    previewCols.push({ key: columnMap.email, label: "Email" });
  }
  if (mode === "sms") {
    if (columnMap?.indicativo) previewCols.push({ key: columnMap.indicativo, label: "Ind." });
    if (columnMap?.phone) previewCols.push({ key: columnMap.phone, label: "Teléfono" });
  }
  if (columnMap?.name) previewCols.push({ key: columnMap.name, label: "Nombre" });
  if (columnMap?.lastname) previewCols.push({ key: columnMap.lastname, label: "Apellido" });

  return (
    <div className="space-y-4">
      {/* File info + remove */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{stats.filename}</p>
          <p className="text-xs text-muted-foreground">
            {stats.totalRows} filas
            {stats.detectedFormat === "full_template"
              ? " (plantilla completa)"
              : " (formato simple)"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          {validRows.length} válidos
        </Badge>
        {invalidRows.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {invalidRows.length} inválidos
          </Badge>
        )}
        {duplicateRows.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {duplicateRows.length} duplicados
          </Badge>
        )}
      </div>

      {/* Column mapping info */}
      {columnMap && (
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          {mode === "email" && columnMap.email && (
            <span>Email: <span className="font-mono">{columnMap.email}</span></span>
          )}
          {mode === "sms" && columnMap.phone && (
            <span>Teléfono: <span className="font-mono">{columnMap.phone}</span></span>
          )}
          {mode === "sms" && columnMap.indicativo && (
            <span>Indicativo: <span className="font-mono">{columnMap.indicativo}</span></span>
          )}
          {columnMap.name && (
            <span>Nombre: <span className="font-mono">{columnMap.name}</span></span>
          )}
        </div>
      )}

      {/* Preview table */}
      {previewCols.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/50 border-b">
            Vista previa (primeras {Math.min(5, rows.length)} filas)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                  {previewCols.map((col) => (
                    <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-20">Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b last:border-0 ${
                      !row.isValid ? "bg-red-50 dark:bg-red-950/20" : row.isDuplicate ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-muted-foreground">{row.rowIndex}</td>
                    {previewCols.map((col) => (
                      <td key={col.key} className="px-3 py-2 text-xs truncate max-w-[200px]">
                        {row.data[col.key] || "-"}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {!row.isValid ? (
                        <span className="text-xs text-red-600" title={row.error}>
                          <XCircle className="h-3 w-3 inline mr-1" />
                          Error
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Dup
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error rows detail + download */}
      {invalidRows.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-600 flex-1">
            {invalidRows.length} fila{invalidRows.length !== 1 ? "s" : ""} con errores
            {invalidRows.length <= 3 &&
              ": " + invalidRows.map((r) => `fila ${r.rowIndex} (${r.error})`).join(", ")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadErrors}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 gap-1 h-7 text-xs"
          >
            <Download className="h-3 w-3" />
            Descargar errores
          </Button>
        </div>
      )}

      {/* Missing column warning */}
      {mode === "email" && !columnMap?.email && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            No se detectó columna de email. Verifica que tu CSV tenga una columna llamada &quot;email&quot;, &quot;e_mail&quot; o &quot;correo&quot;.
          </span>
        </div>
      )}
      {mode === "sms" && !columnMap?.phone && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            No se detectó columna de teléfono. Verifica que tu CSV tenga una columna llamada &quot;telefono&quot;, &quot;movil&quot; o &quot;celular&quot;.
          </span>
        </div>
      )}
    </div>
  );
}
