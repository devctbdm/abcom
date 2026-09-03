"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type OilPoint = {
  label: string;
  km: number;
  oil: string;
  days: number;
};

const chartConfig = {
  km: {
    label: "KM lasted",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function OilChart({
  data,
  intervalKm,
}: {
  data: OilPoint[];
  intervalKm: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Log at least two oil changes to compare oil life.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
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
                    {Number(value).toLocaleString("en-US")} km
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.payload.oil}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.payload.days} days in engine
                  </span>
                </div>
              )}
            />
          }
        />
        <ReferenceLine
          y={intervalKm}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: `due ${intervalKm.toLocaleString("en-US")} km`,
            position: "insideTopRight",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <Bar dataKey="km" fill="var(--color-km)" radius={[6, 6, 0, 0]} maxBarSize={52} />
      </BarChart>
    </ChartContainer>
  );
}
