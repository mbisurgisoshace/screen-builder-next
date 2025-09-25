"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type Option = { label: string; value: string };

type MultiSelectProps = {
  options: Option[];
  value: string | undefined; // current selected values
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  maxBadges?: number; // collapse after N badges
};

function csvToArray(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[]): string {
  // keep order; de-dupe just in case
  const seen = new Set<string>();
  const clean = arr.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
  return clean.join(", ");
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select roles...",
  className,
  showSearch = true,
  maxBadges = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const valueArr = React.useMemo(() => csvToArray(value), [value]);

  const selected = React.useMemo(
    () => options.filter((o) => valueArr.includes(o.value)),
    [options, value]
  );

  function commit(arr: string[]) {
    onChange(arrayToCsv(arr));
  }

  function toggle(val: string) {
    if (valueArr.includes(val)) commit(valueArr.filter((v) => v !== val));
    else commit([...valueArr, val]);
  }

  const isChecked = (val: string) => valueArr.includes(val);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 items-center overflow-hidden whitespace-nowrap">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.slice(0, maxBadges).map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="mr-1 max-w-[11rem] truncate"
              >
                {opt.label}
              </Badge>
            ))}
            {selected.length > maxBadges && (
              <Badge variant="outline" className="shrink-0">
                +{selected.length - maxBadges}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command loop>
          {showSearch && <CommandInput placeholder="Search roles..." />}
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {/* Optional: Select All / Clear All */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => commit(options.map((o) => o.value))}
              >
                Select all
              </button>
              <button
                type="button"
                className="hover:underline"
                onClick={() => commit([])}
              >
                Clear
              </button>
            </div>

            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                keywords={[opt.label]}
                onSelect={() => toggle(opt.value)}
                className="cursor-pointer"
              >
                <Checkbox
                  checked={isChecked(opt.value)}
                  className="mr-2"
                  aria-label={opt.label}
                />
                <span className="flex-1">{opt.label}</span>
                {isChecked(opt.value) && (
                  <Check className="h-4 w-4 opacity-70" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
