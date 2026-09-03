import type {
  FiberClientRow,
  FiberPurchaseRow,
  FiberUsageRow,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FiberPurchase = FiberPurchaseRow & {
  lengthNum: number;
  amountNum: number | null;
  usedM: number; // metres consumed from this drum
  remainingM: number; // metres still on the drum
  costPerMeter: number | null;
  isDepleted: boolean;
};

export type FiberClient = {
  id: number;
  clientId: string; // e.g. razzak@ptap
  name: string;
  zone: string | null;
  phone: string | null;
  totalMeters: number;
  timesServed: number;
  lastDate: string | null;
  cost: number; // attributed taka (meters x drum cost/m)
};

export type FiberUsage = {
  id: number;
  date: string;
  meters: number;
  note: string | null;
  clientId: number;
  clientCode: string;
  clientName: string;
  purchaseId: number | null;
  purchaseLabel: string | null;
  cost: number | null;
};

export type FiberSummary = {
  purchases: FiberPurchase[]; // newest first
  clients: FiberClient[]; // most used first
  usages: FiberUsage[]; // newest first
  totalPurchasedM: number;
  totalUsedM: number;
  stockRemainingM: number;
  stockUsedPercent: number;
  lowStock: boolean;
  outOfStock: boolean;
  clientCount: number;
  totalSpent: number;
  avgCostPerMeter: number | null;
  lastPurchase: FiberPurchase | null;
  lastUsage: FiberUsage | null;
  lastClient: FiberClient | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const LOW_STOCK_THRESHOLD_M = 50;

export function purchaseLabel(p: FiberPurchaseRow): string {
  return `${p.brand} ${p.core}-core ${p.code}`;
}

/* ------------------------------------------------------------------ */
/*  Summary                                                            */
/* ------------------------------------------------------------------ */

export function computeFiberSummary(
  purchaseRows: FiberPurchaseRow[],
  clientRows: FiberClientRow[],
  usageRows: FiberUsageRow[]
): FiberSummary {
  const clientById = new Map(clientRows.map((c) => [c.id, c]));

  // --- per-drum usage -------------------------------------------------
  const usedByPurchase = new Map<number, number>();
  for (const u of usageRows) {
    if (u.purchaseId !== null) {
      usedByPurchase.set(
        u.purchaseId,
        (usedByPurchase.get(u.purchaseId) ?? 0) + Number(u.meters)
      );
    }
  }

  const purchases: FiberPurchase[] = purchaseRows.map((p) => {
    const lengthNum = Number(p.lengthM);
    const amountNum = p.amount === null ? null : Number(p.amount);
    const usedM = usedByPurchase.get(p.id) ?? 0;
    return {
      ...p,
      lengthNum,
      amountNum,
      usedM,
      remainingM: Math.max(0, lengthNum - usedM),
      costPerMeter: amountNum !== null && lengthNum > 0 ? amountNum / lengthNum : null,
      isDepleted: lengthNum - usedM <= 0,
    };
  });
  const purchaseById = new Map(purchases.map((p) => [p.id, p]));

  // --- per-client usage ------------------------------------------------
  const clients: FiberClient[] = clientRows.map((c) => {
    const mine = usageRows.filter((u) => u.clientId === c.id);
    const totalMeters = mine.reduce((s, u) => s + Number(u.meters), 0);
    const cost = mine.reduce((s, u) => {
      const drum =
        u.purchaseId !== null ? purchaseById.get(u.purchaseId) : undefined;
      return s + (drum?.costPerMeter ?? 0) * Number(u.meters);
    }, 0);
    const lastDate = mine
      .map((u) => u.date)
      .sort()
      .pop() ?? null;
    return {
      id: c.id,
      clientId: c.clientId,
      name: c.name || c.clientId.split("@")[0],
      zone: c.zone,
      phone: c.phone,
      totalMeters,
      timesServed: mine.length,
      lastDate,
      cost,
    };
  });
  clients.sort((a, b) => b.totalMeters - a.totalMeters);

  // --- usage log -------------------------------------------------------
  const usages: FiberUsage[] = usageRows.map((u) => {
    const client = clientById.get(u.clientId);
    const drum =
      u.purchaseId !== null ? purchaseById.get(u.purchaseId) : undefined;
    return {
      id: u.id,
      date: u.date,
      meters: Number(u.meters),
      note: u.note,
      clientId: u.clientId,
      clientCode: client?.clientId ?? "—",
      clientName: client?.name || client?.clientId.split("@")[0] || "—",
      purchaseId: u.purchaseId,
      purchaseLabel: drum ? purchaseLabel(drum) : null,
      cost:
        drum?.costPerMeter !== null && drum?.costPerMeter !== undefined
          ? drum.costPerMeter * Number(u.meters)
          : null,
    };
  });

  const totalPurchasedM = purchases.reduce((s, p) => s + p.lengthNum, 0);
  const totalUsedM = usages.reduce((s, u) => s + u.meters, 0);
  const totalSpent = purchases.reduce((s, p) => s + (p.amountNum ?? 0), 0);
  const stockRemainingM = totalPurchasedM - totalUsedM;

  const sortedPurchases = [...purchases].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const sortedUsages = [...usages].sort((a, b) => b.date.localeCompare(a.date));

  return {
    purchases: sortedPurchases,
    clients,
    usages: sortedUsages,
    totalPurchasedM,
    totalUsedM,
    stockRemainingM,
    stockUsedPercent:
      totalPurchasedM > 0
        ? Math.min(100, Math.round((totalUsedM / totalPurchasedM) * 100))
        : 0,
    lowStock:
      stockRemainingM > 0 && stockRemainingM <= LOW_STOCK_THRESHOLD_M,
    outOfStock: stockRemainingM <= 0,
    clientCount: clients.length,
    totalSpent,
    avgCostPerMeter:
      totalPurchasedM > 0 && totalSpent > 0 ? totalSpent / totalPurchasedM : null,
    lastPurchase: sortedPurchases[0] ?? null,
    lastUsage: sortedUsages[0] ?? null,
    lastClient: sortedUsages[0]
      ? clients.find((c) => c.clientId === sortedUsages[0].clientCode) ?? null
      : null,
  };
}
