"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: Date;
}) {
  const [date, setDate] = useState<Date | undefined>(defaultValue ?? new Date());

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start font-normal"
          >
            <CalendarIcon />
            {date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={date}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
