"use client";

import { apiGet } from "@/lib/api-client";
import { DashboardMetrics } from "@/types/dasboard";

function getAuthToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem("imagiq_token");
}

export function useDashboardMetrics() {
  const getMetrics = async () => {
    const token = getAuthToken();
    return await apiGet<DashboardMetrics>("/api/admin/metrics", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };
  return { getMetrics };
}
