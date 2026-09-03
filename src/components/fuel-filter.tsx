"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export function FuelFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";

  const handleValueChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", value);
    }
    window.location.href = url.toString();
  };

  return (
    <Select value={currentFilter} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by date" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All time</SelectItem>
        <SelectItem value="current_month">Current month</SelectItem>
        <SelectItem value="last_month">Last month</SelectItem>
        <SelectItem value="current_year">Current year</SelectItem>
        <SelectItem value="last_year">Last year</SelectItem>
      </SelectContent>
    </Select>
  );
}
