"use client";

import { useState, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Request DTO
export interface VerifyPickupDto {
  serialId: number;
  numeroDocumento: string;
  token: string;
}

// Response Types
export interface VerifyPickupData {
  serialId: number;
  metodoEnvio: number;
  estado: string;
  numeroDocumento: string;
  tokenUsado: boolean;
  entregado: boolean;
  activa: boolean;
  recogidaId: string;
}

export interface VerifyPickupSuccessResponse {
  valid: true;
  message: string;
  data: VerifyPickupData;
}

export interface VerifyPickupFailedResponse {
  valid: false;
  message: string;
  data: null;
}

export type VerifyPickupResponse =
  | VerifyPickupSuccessResponse
  | VerifyPickupFailedResponse;

interface UseVerifyPickupReturn {
  verify: (
    serialId: number,
    documento: string,
    token: string
  ) => Promise<VerifyPickupResponse>;
  isLoading: boolean;
  result: VerifyPickupResponse | null;
  error: string | null;
  reset: () => void;
}

export function useVerifyPickup(): UseVerifyPickupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyPickupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    if (globalThis.window !== undefined) {
      return localStorage.getItem("imagiq_token");
    }
    return null;
  };

  const verify = useCallback(
    async (
      serialId: number,
      documento: string,
      token: string
    ): Promise<VerifyPickupResponse> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const authToken = getAuthToken();

        if (!authToken) {
          const failedResponse: VerifyPickupFailedResponse = {
            valid: false,
            message: "No hay sesión activa",
            data: null,
          };
          setResult(failedResponse);
          return failedResponse;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/pickup-orders/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              serialId,
              numeroDocumento: documento,
              token,
            }),
          }
        );

        if (response.status === 401) {
          const failedResponse: VerifyPickupFailedResponse = {
            valid: false,
            message: "Sesión expirada. Por favor, inicie sesión nuevamente.",
            data: null,
          };
          setResult(failedResponse);
          return failedResponse;
        }

        if (response.status === 403) {
          const failedResponse: VerifyPickupFailedResponse = {
            valid: false,
            message: "No tiene permisos para verificar órdenes.",
            data: null,
          };
          setResult(failedResponse);
          return failedResponse;
        }

        if (response.status === 400) {
          // Leer el mensaje de error del body de la respuesta
          try {
            const errorData = await response.json();
            const failedResponse: VerifyPickupFailedResponse = {
              valid: false,
              message: errorData.message || "Datos de entrada inválidos",
              data: null,
            };
            setResult(failedResponse);
            return failedResponse;
          } catch {
            const failedResponse: VerifyPickupFailedResponse = {
              valid: false,
              message: "Datos de entrada inválidos",
              data: null,
            };
            setResult(failedResponse);
            return failedResponse;
          }
        }

        if (!response.ok) {
          // Intentar leer el mensaje de error para otros códigos de estado
          try {
            const errorData = await response.json();
            const failedResponse: VerifyPickupFailedResponse = {
              valid: false,
              message: errorData.message || `Error del servidor: ${response.status}`,
              data: null,
            };
            setResult(failedResponse);
            return failedResponse;
          } catch {
            const failedResponse: VerifyPickupFailedResponse = {
              valid: false,
              message: `Error del servidor: ${response.status}`,
              data: null,
            };
            setResult(failedResponse);
            return failedResponse;
          }
        }

        const data: VerifyPickupResponse = await response.json();
        setResult(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error de conexión";
        setError(errorMessage);
        const failedResponse: VerifyPickupFailedResponse = {
          valid: false,
          message: errorMessage,
          data: null,
        };
        setResult(failedResponse);
        return failedResponse;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { verify, isLoading, result, error, reset };
}
