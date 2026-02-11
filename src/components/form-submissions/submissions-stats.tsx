"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Eye, CheckCircle, Calendar } from "lucide-react";
import type { FormSubmissionStats } from "@/types/form-page";

interface SubmissionsStatsProps {
  stats: FormSubmissionStats | null;
  isLoading: boolean;
}

export function SubmissionsStats({ stats, isLoading }: SubmissionsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Total", value: stats?.total || 0, icon: Inbox, description: "Respuestas totales" },
    { title: "Nuevas", value: stats?.nuevo || 0, icon: Eye, description: "Sin leer", color: "text-blue-500" },
    { title: "Procesadas", value: stats?.procesado || 0, icon: CheckCircle, description: "Completadas", color: "text-green-500" },
    { title: "Hoy", value: stats?.today || 0, icon: Calendar, description: "Respuestas hoy" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color || "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
