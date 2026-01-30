"use client";

import { useState, useCallback } from "react";
import { smsEndpoints, SmsResult, BulkSmsResult } from "@/lib/api";
import { toast } from "sonner";

export interface SmsRecipient {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  customMessage?: string;
}

export interface UseSmsReturn {
  // Estado
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  lastResult: SmsResult | BulkSmsResult | null;

  // Acciones
  sendSms: (phoneNumber: string, message: string, messageType?: 'Transactional' | 'Promotional') => Promise<SmsResult | null>;
  sendBulkSms: (recipients: SmsRecipient[], message: string, messageType?: 'Transactional' | 'Promotional') => Promise<BulkSmsResult | null>;
  sendOtp: (phoneNumber: string, otp: string) => Promise<SmsResult | null>;
  validatePhone: (phoneNumber: string) => Promise<boolean>;
  formatPhone: (phoneNumber: string, countryCode?: string) => Promise<string | null>;
  checkHealth: () => Promise<boolean>;
  clearError: () => void;
}

export function useSms(): UseSmsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SmsResult | BulkSmsResult | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendSms = useCallback(async (
    phoneNumber: string,
    message: string,
    messageType: 'Transactional' | 'Promotional' = 'Transactional'
  ): Promise<SmsResult | null> => {
    setIsSending(true);
    setError(null);

    try {
      const response = await smsEndpoints.send({
        phoneNumber,
        message,
        messageType,
      });

      if (response.success && response.data) {
        setLastResult(response.data);
        if (response.data.success) {
          toast.success("SMS enviado correctamente");
        } else {
          toast.error(response.data.error || "Error al enviar SMS");
        }
        return response.data;
      } else {
        const errorMsg = response.message || "Error al enviar SMS";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al enviar SMS";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendBulkSms = useCallback(async (
    recipients: SmsRecipient[],
    message: string,
    messageType: 'Transactional' | 'Promotional' = 'Promotional'
  ): Promise<BulkSmsResult | null> => {
    setIsSending(true);
    setError(null);

    try {
      const response = await smsEndpoints.sendBulk({
        recipients: recipients.map(r => ({
          phoneNumber: r.phoneNumber,
          customMessage: r.customMessage,
        })),
        message,
        messageType,
      });

      if (response.success && response.data) {
        setLastResult(response.data);
        const { successful, failed, total } = response.data;

        if (failed === 0) {
          toast.success(`${successful} SMS enviados correctamente`);
        } else if (successful === 0) {
          toast.error(`Error: No se pudo enviar ningún SMS`);
        } else {
          toast.warning(`${successful}/${total} SMS enviados. ${failed} fallaron.`);
        }

        return response.data;
      } else {
        const errorMsg = response.message || "Error al enviar SMS masivo";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al enviar SMS masivo";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendOtp = useCallback(async (
    phoneNumber: string,
    otp: string
  ): Promise<SmsResult | null> => {
    setIsSending(true);
    setError(null);

    try {
      const response = await smsEndpoints.sendOtp({ phoneNumber, otp });

      if (response.success && response.data) {
        setLastResult(response.data);
        if (response.data.success) {
          toast.success("OTP enviado correctamente");
        } else {
          toast.error(response.data.error || "Error al enviar OTP");
        }
        return response.data;
      } else {
        const errorMsg = response.message || "Error al enviar OTP";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al enviar OTP";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  const validatePhone = useCallback(async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await smsEndpoints.validatePhone(phoneNumber);
      return response.success && response.data?.isValid === true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al validar teléfono";
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatPhone = useCallback(async (
    phoneNumber: string,
    countryCode?: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await smsEndpoints.formatPhone(phoneNumber, countryCode);
      if (response.success && response.data) {
        return response.data.formatted;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al formatear teléfono";
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await smsEndpoints.health();
      return response.success && response.data?.status === 'ok';
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isSending,
    error,
    lastResult,
    sendSms,
    sendBulkSms,
    sendOtp,
    validatePhone,
    formatPhone,
    checkHealth,
    clearError,
  };
}
