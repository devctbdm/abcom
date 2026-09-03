import type { FuelEntry } from "@/lib/stats";
import { fmtDate, fmtDays, fmtLiters, fmtTaka } from "@/lib/format";
import { deleteFuelLog } from "@/app/actions/fuel";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function KmplBadge({ kmpl }: { kmpl: number | null }) {
  if (kmpl === null) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        Running
      </Badge>
    );
  }
  if (kmpl >= 55) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        {kmpl.toFixed(1)} km/L
      </Badge>
    );
  }
  if (kmpl >= 45) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        {kmpl.toFixed(1)} km/L
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
      {kmpl.toFixed(1)} km/L
    </Badge>
  );
}

export function FuelTable({
  entries,
  showActions = false,
}: {
  entries: FuelEntry[];
  showActions?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Odometer</TableHead>
          <TableHead className="text-right">Litres</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">৳ / L</TableHead>
          <TableHead className="text-right">KM run</TableHead>
          <TableHead>Mileage</TableHead>
          <TableHead className="text-right">Days run</TableHead>
          {showActions ? <TableHead className="w-10" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{fmtDate(entry.date)}</span>
                {entry.note ? (
                  <span className="max-w-32 truncate text-xs text-muted-foreground">
                    {entry.note}
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {entry.odometer.toLocaleString("en-US")} km
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {fmtLiters(entry.liters)} L
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {fmtTaka(entry.amount)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              ৳{entry.pricePerLiter.toFixed(1)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {entry.distanceRun !== null
                ? `${entry.distanceRun.toLocaleString("en-US")} km`
                : "—"}
            </TableCell>
            <TableCell>
              <KmplBadge kmpl={entry.kmPerLiter} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {entry.daysRun !== null
                ? fmtDays(entry.daysRun)
                : entry.daysSince === 0
                  ? "Today"
                  : `Day ${entry.daysSince + 1}`}
            </TableCell>
            {showActions ? (
              <TableCell>
                <DeleteEntryButton
                  id={entry.id}
                  title="Delete this refill?"
                  description={`${fmtLiters(entry.liters)} L for ${fmtTaka(entry.amount)} on ${fmtDate(entry.date)} will be removed permanently.`}
                  onDelete={deleteFuelLog}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
