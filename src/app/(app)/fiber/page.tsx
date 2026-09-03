import {
  Cable,
  CircleDollarSign,
  Gauge,
  Scissors,
  TriangleAlert,
  Users,
} from "lucide-react";
import { asc, desc } from "drizzle-orm";

import { db } from "@/db";
import {
  fiberClients,
  fiberPurchases,
  fiberUsages,
} from "@/db/schema";
import { BuyFiberDialog } from "@/components/fiber/buy-fiber-dialog";
import { LogUsageDialog } from "@/components/fiber/log-usage-dialog";
import { FiberUsageChart } from "@/components/fiber/fiber-usage-chart";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteFiberClient,
  deleteFiberPurchase,
  deleteFiberUsage,
} from "@/app/actions/fiber";
import { computeFiberSummary, purchaseLabel } from "@/lib/fiber-stats";
import { fmtDate, fmtTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadFiber() {
  try {
    const [purchases, clients, usages] = await Promise.all([
      db.select().from(fiberPurchases).orderBy(asc(fiberPurchases.date), asc(fiberPurchases.id)),
      db.select().from(fiberClients).orderBy(asc(fiberClients.id)),
      db.select().from(fiberUsages).orderBy(desc(fiberUsages.date)),
    ]);
    return { purchases, clients, usages };
  } catch {
    return { purchases: [], clients: [], usages: [] };
  }
}

function StockBadge({
  lowStock,
  outOfStock,
}: {
  lowStock: boolean;
  outOfStock: boolean;
}) {
  if (outOfStock)
    return <Badge variant="destructive">Out of stock</Badge>;
  if (lowStock)
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Low stock
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      In stock
    </Badge>
  );
}

export default async function FiberPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; use?: string }>;
}) {
  const sp = await searchParams;
  const { purchases, clients, usages } = await loadFiber();
  const fiber = computeFiberSummary(purchases, clients, usages);

  const drumOptions = fiber.purchases
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      id: p.id,
      label: `${purchaseLabel(p)} · ${p.date}`,
      remaining: p.remainingM,
    }));

  const clientOptions = fiber.clients
    .slice()
    .sort((a, b) => a.clientId.localeCompare(b.clientId))
    .map((c) => ({ id: c.id, clientId: c.clientId, name: c.name }));

  const chartData = fiber.clients.map((c) => ({
    label: c.clientId.split("@")[0],
    meters: c.totalMeters,
    name: c.name,
    times: c.timesServed,
  }));

  /* ---------------- Onboarding: no purchases yet ---------------- */
  if (purchases.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-4 text-sky-500">
              <Cable className="size-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">Start tracking fiber stock</CardTitle>
              <CardDescription>
                Record your first drum — e.g. <b>Leo · 2-core · FTTH · 500 m</b>{" "}
                on 30/08/26 — then log each client&apos;s meters. Stock,
                low-stock alerts and cost per client update automatically.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <BuyFiberDialog defaultOpen />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Fiber Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {fiber.purchases.length} drum{fiber.purchases.length === 1 ? "" : "s"} ·{" "}
            {fiber.clientCount} client{fiber.clientCount === 1 ? "" : "s"} served ·
            usages deducted oldest drum first
          </p>
        </div>
        <div className="flex gap-2">
          <LogUsageDialog
            drums={drumOptions}
            clients={clientOptions}
            defaultOpen={sp.use === "1"}
          />
          <BuyFiberDialog defaultOpen={sp.new === "1"} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Stock remaining"
          value={`${fiber.stockRemainingM.toFixed(0)} m`}
          sub={`of ${fiber.totalPurchasedM.toFixed(0)} m bought · ${fiber.stockUsedPercent}% used`}
          icon={Gauge}
          tone={fiber.outOfStock ? "rose" : fiber.lowStock ? "amber" : "emerald"}
        />
        <StatCard
          title="Total purchased"
          value={`${fiber.totalPurchasedM.toFixed(0)} m`}
          sub={
            fiber.lastPurchase
              ? `Last: ${purchaseLabel(fiber.lastPurchase)} · ${fmtDate(fiber.lastPurchase.date)}`
              : undefined
          }
          icon={Cable}
          tone="sky"
        />
        <StatCard
          title="Total used"
          value={`${fiber.totalUsedM.toFixed(0)} m`}
          sub={`${fiber.usages.length} usage log${fiber.usages.length === 1 ? "" : "s"}`}
          icon={Scissors}
          tone="violet"
        />
        <StatCard
          title="Fiber cost"
          value={fiber.totalSpent > 0 ? fmtTaka(fiber.totalSpent) : "—"}
          sub={
            fiber.avgCostPerMeter !== null
              ? `৳${fiber.avgCostPerMeter.toFixed(2)} per metre`
              : "Add cost when buying drums"
          }
          icon={CircleDollarSign}
          tone="orange"
        />
      </div>

      {/* Stock status + chart */}
      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1.5">
              <CardTitle className="text-base">Stock status</CardTitle>
              <CardDescription>
                {fiber.totalPurchasedM.toFixed(0)} m bought ·{" "}
                {fiber.totalUsedM.toFixed(0)} m used ·{" "}
                <span className="font-medium text-foreground">
                  {fiber.stockRemainingM.toFixed(0)} m available
                </span>
              </CardDescription>
            </div>
            <StockBadge lowStock={fiber.lowStock} outOfStock={fiber.outOfStock} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Progress value={fiber.stockUsedPercent} />
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{fiber.stockUsedPercent}% consumed</span>
                <span>
                  {Math.max(0, 100 - fiber.stockUsedPercent)}% left
                </span>
              </div>
            </div>
            {fiber.outOfStock ? (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <TriangleAlert className="size-4" />
                All fiber is used. Buy a new drum to keep serving clients.
              </div>
            ) : fiber.lowStock ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <TriangleAlert className="size-4" />
                Running low — only {fiber.stockRemainingM.toFixed(0)} m left.
                Plan the next drum.
              </div>
            ) : null}
            {fiber.lastUsage ? (
              <p className="text-sm text-muted-foreground">
                Last usage:{" "}
                <span className="font-medium text-foreground">
                  {fiber.lastUsage.clientCode}
                </span>{" "}
                got {fiber.lastUsage.meters.toFixed(0)} m on{" "}
                {fmtDate(fiber.lastUsage.date)}.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Meters per client</CardTitle>
            <CardDescription>Total fiber given to each client</CardDescription>
          </CardHeader>
          <CardContent>
            <FiberUsageChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      {/* Clients */}
      <Card id="clients" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-violet-500" />
            Fiber clients
          </CardTitle>
          <CardDescription>
            Rollup per client — meters, times served and attributed cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiber.clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clients yet — create one while logging the first usage.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Meters used</TableHead>
                  <TableHead className="text-right">Times served</TableHead>
                  <TableHead className="text-right">Last served</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiber.clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.clientId}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      {c.zone ? (
                        <Badge variant="secondary">{c.zone}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {c.totalMeters.toFixed(0)} m
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.timesServed}×
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.lastDate ? fmtDate(c.lastDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.cost > 0 ? fmtTaka(c.cost) : "—"}
                    </TableCell>
                    <TableCell>
                      <DeleteEntryButton
                        id={c.id}
                        title={`Delete ${c.clientId}?`}
                        description="This removes the client together with all of their fiber usage history."
                        onDelete={deleteFiberClient}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Purchases */}
      <Card id="purchases" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-base">Fiber purchases</CardTitle>
          <CardDescription>
            Drums bought — per-drum stock is deducted automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Core</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">৳ / m</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fiber.purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{fmtDate(p.date)}</TableCell>
                  <TableCell>{p.brand}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.core}-core</Badge>
                  </TableCell>
                  <TableCell>{p.code}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.lengthNum.toFixed(0)} m
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.amountNum !== null ? fmtTaka(p.amountNum) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {p.costPerMeter !== null ? `৳${p.costPerMeter.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.usedM.toFixed(0)} m
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        p.isDepleted
                          ? "font-medium text-rose-600"
                          : "font-medium text-emerald-600"
                      }
                    >
                      {p.remainingM.toFixed(0)} m
                    </span>
                  </TableCell>
                  <TableCell>
                    <DeleteEntryButton
                      id={p.id}
                      title="Delete this purchase?"
                      description="The drum is removed. Usage history stays, but becomes unassigned."
                      onDelete={deleteFiberPurchase}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage log */}
      <Card id="usage" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-base">Usage log</CardTitle>
          <CardDescription>
            Every meter given, newest first — stock is always
            purchases − usages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiber.usages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No usage yet — log the first client with “Log Usage”.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Meters</TableHead>
                  <TableHead>From drum</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiber.usages.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{fmtDate(u.date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.clientCode}</span>
                        <span className="text-xs text-muted-foreground">
                          {u.clientName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {u.meters.toFixed(0)} m
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.purchaseLabel ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.cost !== null ? fmtTaka(u.cost) : "—"}
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">
                      {u.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      <DeleteEntryButton
                        id={u.id}
                        title="Delete this usage?"
                        description="The meters return to stock automatically."
                        onDelete={deleteFiberUsage}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
