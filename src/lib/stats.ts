import type { FuelLogRow, OilChangeRow } from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Recommended engine-oil drain interval for the bike (in KM). */
export const OIL_CHANGE_INTERVAL_KM = 1200;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FuelEntry = {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number; // taka
  liters: number;
  odometer: number;
  note: string | null;
  pricePerLiter: number;
  /** KM this fill carried the bike before the next refill (null for latest). */
  distanceRun: number | null;
  /** KM per litre achieved by this fill (null for latest). */
  kmPerLiter: number | null;
  /** Days this fill lasted before the next refill (null for latest). */
  daysRun: number | null;
  /** Taka per KM for this fill (null for latest). */
  costPerKm: number | null;
  /** Days elapsed since this fill (used for the latest running fill). */
  daysSince: number;
  isLatest: boolean;
  isFirst: boolean;
};

export type FuelSummary = {
  entries: FuelEntry[]; // newest first
  chronological: FuelEntry[]; // oldest first
  count: number;
  totalSpent: number;
  totalLiters: number;
  currentOdometer: number;
  firstOdometer: number;
  distanceCovered: number; // km between first and latest reading
  litersConsumed: number; // litres burned between first & latest (excl. latest fill)
  spentOnConsumed: number; // taka for those consumed litres
  avgKmPerLiter: number | null;
  costPerKm: number | null;
  avgPricePerLiter: number | null;
  avgFillAmount: number;
  avgFillLiters: number;
  avgDaysBetweenFills: number | null;
  trackingDays: number;
  latest: FuelEntry | null;
  /** The latest fill that has fully burned (has a next reading). */
  lastCompleted: FuelEntry | null;
  lastRefill: FuelEntry | null;
  pricePerLiterLatest: number | null;
};

export type OilEntry = {
  id: number;
  date: string;
  odometer: number;
  oilName: string;
  amount: number | null;
  quantity: number | null;
  note: string | null;
  /** KM this oil ran before it was drained (next change). */
  kmLasted: number | null;
  /** Days this oil stayed in the engine. */
  daysLasted: number | null;
  isLatest: boolean;
};

export type OilStatus = {
  hasChanges: boolean;
  lastChange: OilEntry | null;
  kmSinceChange: number;
  kmRemaining: number;
  usagePercent: number; // 0..100 of interval used
  daysSinceChange: number;
  status: "no-data" | "ok" | "due-soon" | "overdue";
  intervalKm: number;
  history: OilEntry[]; // newest first
  totalSpent: number;
  lastKmLasted: number | null;
  dueOdometer: number | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------------------------------------------ */
/*  Fuel stats                                                         */
/* ------------------------------------------------------------------ */

export function computeFuelSummary(rows: FuelLogRow[]): FuelSummary {
  const sorted = [...rows].sort((a, b) =>
    a.odometer === b.odometer
      ? a.date.localeCompare(b.date)
      : a.odometer - b.odometer
  );

  const today = todayISO();

  const chronological: FuelEntry[] = sorted.map((row, i) => {
    const amount = Number(row.amount);
    const liters = Number(row.liters);
    const next = sorted[i + 1];
    const distanceRun = next ? next.odometer - row.odometer : null;
    const daysRun = next ? daysBetween(row.date, next.date) : null;
    return {
      id: row.id,
      date: row.date,
      amount,
      liters,
      odometer: row.odometer,
      note: row.note,
      pricePerLiter: liters > 0 ? amount / liters : 0,
      distanceRun,
      kmPerLiter:
        distanceRun !== null && liters > 0 ? distanceRun / liters : null,
      daysRun,
      costPerKm: distanceRun !== null && distanceRun > 0 ? amount / distanceRun : null,
      daysSince: daysBetween(row.date, today),
      isLatest: i === sorted.length - 1,
      isFirst: i === 0,
    };
  });

  const entries = [...chronological].reverse();
  const count = chronological.length;
  const latest = entries[0] ?? null;
  const lastRefill = latest;

  const totalSpent = chronological.reduce((s, e) => s + e.amount, 0);
  const totalLiters = chronological.reduce((s, e) => s + e.liters, 0);

  const currentOdometer = latest?.odometer ?? 0;
  const firstOdometer = chronological[0]?.odometer ?? 0;
  const distanceCovered = count > 1 ? currentOdometer - firstOdometer : 0;

  // The latest fill has not been burned yet — exclude it from consumption math.
  const consumed = latest ? chronological.slice(0, -1) : [];
  const litersConsumed = consumed.reduce((s, e) => s + e.liters, 0);
  const spentOnConsumed = consumed.reduce((s, e) => s + e.amount, 0);

  const avgKmPerLiter =
    distanceCovered > 0 && litersConsumed > 0
      ? distanceCovered / litersConsumed
      : null;
  const costPerKm =
    distanceCovered > 0 && spentOnConsumed > 0
      ? spentOnConsumed / distanceCovered
      : null;
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : null;

  const lastCompleted = entries.find((e) => e.distanceRun !== null) ?? null;

  const dayGaps = chronological
    .map((e) => e.daysRun)
    .filter((d): d is number => d !== null);
  const avgDaysBetweenFills =
    dayGaps.length > 0
      ? dayGaps.reduce((a, b) => a + b, 0) / dayGaps.length
      : null;

  const trackingDays =
    count > 1 ? daysBetween(chronological[0].date, latest!.date) : 0;

  return {
    entries,
    chronological,
    count,
    totalSpent,
    totalLiters,
    currentOdometer,
    firstOdometer,
    distanceCovered,
    litersConsumed,
    spentOnConsumed,
    avgKmPerLiter,
    costPerKm,
    avgPricePerLiter,
    avgFillAmount: count > 0 ? totalSpent / count : 0,
    avgFillLiters: count > 0 ? totalLiters / count : 0,
    avgDaysBetweenFills,
    trackingDays,
    latest,
    lastCompleted,
    lastRefill,
    pricePerLiterLatest: latest ? latest.pricePerLiter : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Mobil / engine-oil stats                                           */
/* ------------------------------------------------------------------ */

export function computeOilStatus(
  rows: OilChangeRow[],
  currentOdometer: number,
  intervalKm: number = OIL_CHANGE_INTERVAL_KM
): OilStatus {
  const sorted = [...rows].sort((a, b) =>
    a.odometer === b.odometer
      ? a.date.localeCompare(b.date)
      : a.odometer - b.odometer
  );

  const today = todayISO();

  const chrono: OilEntry[] = sorted.map((row, i) => {
    const next = sorted[i + 1];
    return {
      id: row.id,
      date: row.date,
      odometer: row.odometer,
      oilName: row.oilName,
      amount: row.amount === null ? null : Number(row.amount),
      quantity: row.quantity === null ? null : Number(row.quantity),
      note: row.note,
      kmLasted: next ? next.odometer - row.odometer : null,
      daysLasted: next ? daysBetween(row.date, next.date) : null,
      isLatest: i === sorted.length - 1,
    };
  });

  const history = [...chrono].reverse();
  const lastChange = history[0] ?? null;
  const lastKmLasted =
    history.find((e) => e.kmLasted !== null)?.kmLasted ?? null;

  const odoNow = Math.max(
    currentOdometer,
    lastChange?.odometer ?? 0
  );
  const kmSinceChange = lastChange ? odoNow - lastChange.odometer : 0;
  const daysSinceChange = lastChange ? daysBetween(lastChange.date, today) : 0;
  const usagePercent = Math.min(
    100,
    Math.round((kmSinceChange / intervalKm) * 100)
  );
  const kmRemaining = Math.max(0, intervalKm - kmSinceChange);

  // Due-soon threshold: bikes 150 km before due, cars ~8% of their interval.
  const dueSoonWindow = intervalKm > 2000 ? Math.round(intervalKm * 0.08) : 150;

  let status: OilStatus["status"] = "no-data";
  if (lastChange) {
    if (kmSinceChange >= intervalKm) status = "overdue";
    else if (kmRemaining <= dueSoonWindow) status = "due-soon";
    else status = "ok";
  }

  return {
    hasChanges: lastChange !== null,
    lastChange,
    kmSinceChange,
    kmRemaining,
    usagePercent,
    daysSinceChange,
    status,
    intervalKm,
    history,
    totalSpent: chrono.reduce((s, e) => s + (e.amount ?? 0), 0),
    lastKmLasted,
    dueOdometer: lastChange ? lastChange.odometer + intervalKm : null,
  };
}
