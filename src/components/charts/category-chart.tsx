"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
  "hsl(142, 76%, 36%)", // Verde principal
  "hsl(120, 60%, 50%)", // Verde claro
  "hsl(160, 70%, 40%)", // Verde azulado
  "hsl(100, 65%, 45%)", // Verde amarillento
  "hsl(180, 55%, 45%)", // Verde agua
  "hsl(var(--muted-foreground))", // Fallback
];

const chartConfig = {
  value: {
    label: "Porcentaje",
  },
};

interface CategoryChartProps {
  data: Array<{
    name: string;
    value: number;
    sales: number;
  }>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[200px] sm:h-[250px] lg:h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [`${value}%`, name]}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
