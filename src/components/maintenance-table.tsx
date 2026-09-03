import type { MaintenanceRow } from "@/db/schema";
import { fmtDate, fmtTaka } from "@/lib/format";
import { deleteMaintenance } from "@/app/actions/maintenance";
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

function TypeBadge({ type }: { type: string }) {
  if (type === "PARTS") {
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        Parts
      </Badge>
    );
  }
  return (
    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
      Service
    </Badge>
  );
}

function formatTime(time: Date | null) {
  if (!time) return "—";
  return new Date(time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MaintenanceTable({
  entries,
  showActions = false,
}: {
  entries: MaintenanceRow[];
  showActions?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Shop</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {showActions ? <TableHead className="w-10" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <TypeBadge type={entry.type} />
            </TableCell>
            <TableCell>
              <span className="font-medium">{fmtDate(entry.date)}</span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatTime(entry.time)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{entry.description}</span>
                {entry.note ? (
                  <span className="max-w-48 truncate text-xs text-muted-foreground">
                    {entry.note}
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {entry.shopName || "—"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {fmtTaka(Number(entry.amount))}
            </TableCell>
            {showActions ? (
              <TableCell>
                <DeleteEntryButton
                  id={entry.id}
                  title="Delete this maintenance record?"
                  description={`${entry.type}: ${entry.description} for ${fmtTaka(Number(entry.amount))} on ${fmtDate(entry.date)} will be removed permanently.`}
                  onDelete={deleteMaintenance}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
