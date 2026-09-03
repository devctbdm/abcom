"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type FiberUsagePoint = {
  label: string;
  meters: number;
  name: string;
  times: number;
};

const chartConfig = {
  meters: {
    label: "Meters used",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function FiberUsageChart({ data }: { data: FiberUsagePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Log fiber usage to see meters per client.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold tabular-nums">
                    {Number(value).toFixed(0)} m
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.payload.name} · served {item.payload.times}×
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="meters"
          fill="var(--color-meters)"
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ChartContainer>
  );
}
