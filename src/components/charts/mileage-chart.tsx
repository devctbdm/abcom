"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type MileagePoint = {
  label: string;
  kmpl: number;
  liters: number;
  distance: number;
  days: number;
};

const chartConfig = {
  kmpl: {
    label: "KM per litre",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MileageChart({
  data,
  average,
}: {
  data: MileagePoint[];
  average: number | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Add at least two refills to see mileage.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, (dataMax: number) => Math.ceil(dataMax + 12)]}
          tickFormatter={(v: number) => `${v}`}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold tabular-nums">
                    {Number(value).toFixed(1)} km/L
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.payload.liters.toFixed(2)} L · {item.payload.distance}{" "}
                    km · {item.payload.days} day
                    {item.payload.days === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            />
          }
        />
        {average !== null ? (
          <ReferenceLine
            y={average}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: `avg ${average.toFixed(1)}`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
        ) : null}
        <Bar dataKey="kmpl" fill="var(--color-kmpl)" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ChartContainer>
  );
}
