const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function fmtInt(n: number): string {
  return numberFmt.format(Math.round(n));
}

export function fmtTaka(n: number, decimals = 0): string {
  return `৳${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)}`;
}

export function fmtLiters(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtKmpl(n: number | null): string {
  return n === null ? "—" : n.toFixed(1);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function fmtDays(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "Same day";
  return `${n} day${n === 1 ? "" : "s"}`;
}
