import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fuelLogs } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const vehicleId = Number(formData.get("vehicleId"));
    const vehicleName = formData.get("vehicleName") as string;
    const startDate = formData.get("startDate") as string | null;
    const endDate = formData.get("endDate") as string | null;

    if (!vehicleId || !vehicleName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const conditions = [eq(fuelLogs.vehicleId, vehicleId)];
    
    if (startDate) {
      conditions.push(gte(fuelLogs.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(fuelLogs.date, endDate));
    }
    
    const rows = await db
      .select()
      .from(fuelLogs)
      .where(and(...conditions))
      .orderBy(fuelLogs.date);

    const data = rows.map((row) => ({
      Date: row.date,
      Odometer: Number(row.odometer),
      "Litres (L)": Number(row.liters),
      "Amount (৳)": Number(row.amount),
      "Price per L (৳)": (Number(row.amount) / Number(row.liters)).toFixed(2),
      Note: row.note || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fuel Log");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `${vehicleName.replace(/\s+/g, "_")}_fuel_log${startDate ? `_${startDate}_to_${endDate}` : ""}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
