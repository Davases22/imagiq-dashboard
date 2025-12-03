"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(142, 76%, 36%)", // Verde más vibrante
  },
};

interface OverviewChartProps {
  data: Array<{
    month: string;
    sales: number;
  }>;
}

export function OverviewChart({ data }: Readonly<OverviewChartProps>) {
  console.log("OverviewChart data:", data);
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[250px] sm:h-[300px] lg:h-[350px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            width={45}
            tick={{ fontSize: 10 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="hsl(142, 76%, 36%)"
            fill="hsl(142, 76%, 36%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
