import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function DateTimePicker({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date) => void;
}) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(value);

  const timeString = useMemo(() => {
    if (!internalDate) return "12:00";
    return `${String(internalDate.getHours()).padStart(2, "0")}:${String(
      internalDate.getMinutes()
    ).padStart(2, "0")}`;
  }, [internalDate]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    const updated = new Date(newDate);
    if (internalDate) {
      updated.setHours(internalDate.getHours());
      updated.setMinutes(internalDate.getMinutes());
    }
    setInternalDate(updated);
    onChange(updated);
  };

  const handleTimeChange = (newTime: string) => {
    if (!internalDate) return;
    const [hours, minutes] = newTime.split(":").map(Number);
    const updated = new Date(internalDate);
    updated.setHours(hours);
    updated.setMinutes(minutes);
    setInternalDate(updated);
    onChange(updated);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[260px] justify-start text-left font-normal"
        >
          {internalDate ? (
            format(internalDate, "PPPp")
          ) : (
            <span>Pick a date & time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col space-y-2 w-auto p-4">
        <Calendar
          mode="single"
          selected={internalDate}
          onSelect={handleDateChange}
          initialFocus
        />
        <Input
          type="time"
          value={timeString}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-full"
        />
      </PopoverContent>
    </Popover>
  );
}
