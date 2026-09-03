"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type SpendPoint = {
  label: string;
  amount: number;
  liters: number;
  pricePerLiter: number;
};

const chartConfig = {
  amount: {
    label: "Spent",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function SpendChart({ data }: { data: SpendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Add your first refill to see fuel spending.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          width={48}
          tickFormatter={(v: number) => `৳${v}`}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold tabular-nums">
                    ৳{Number(value).toLocaleString("en-US")}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.payload.liters.toFixed(2)} L @ ৳
                    {item.payload.pricePerLiter.toFixed(1)}/L
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="amount"
          type="monotone"
          fill="url(#fillSpend)"
          stroke="var(--color-amount)"
          strokeWidth={2}
          dot={{ fill: "var(--color-amount)", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
