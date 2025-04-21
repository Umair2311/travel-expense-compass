
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Extra props to support custom mobile behavior
type ModeType = "single" | "range";
export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  // Optionally force mobile split mode
  forceMobileSplit?: boolean;
  mode?: ModeType;
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void;
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  forceMobileSplit,
  mode,
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  const isMobile = useIsMobile();
  // If forceMobileSplit, or on mobile with mode: 'range', we split to two calendars
  const useMobileSplitCal = (isMobile && mode === "range") || forceMobileSplit;

  // For simplicity, requiring parent to provide two selected/onSelect for mobile split – document in comments
  if (useMobileSplitCal) {
    const dateRange = (selected ?? {}) as { from?: Date; to?: Date };
    const onSelectRange = (updater: Partial<{ from: Date | undefined; to: Date | undefined }>) => {
      onSelect?.({ ...dateRange, ...updater });
    };
    return (
      <div className={cn("flex flex-col gap-2 pointer-events-auto", className)}>
        <div>
          <span className="block font-medium text-sm mb-1">From</span>
          <DayPicker
            mode="single"
            selected={dateRange.from}
            onSelect={date => onSelectRange({ from: date })}
            showOutsideDays={showOutsideDays}
            className={cn("p-3 pointer-events-auto")}
            {...props}
          />
        </div>
        <div>
          <span className="block font-medium text-sm mb-1">To</span>
          <DayPicker
            mode="single"
            selected={dateRange.to}
            onSelect={date => onSelectRange({ to: date })}
            showOutsideDays={showOutsideDays}
            className={cn("p-3 pointer-events-auto")}
            {...props}
          />
        </div>
      </div>
    );
  }

  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      numberOfMonths={isMobile ? 1 : props.numberOfMonths || 2}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

// Usage: 
// - Desktop/tablet with mode="range" uses built-in range picker.
// - On mobile, with mode="range", component switches to two single pickers for from/to.
// - You can also force split with forceMobileSplit.
// - Parent must handle selected as {from, to} and an onSelect that updates both.

