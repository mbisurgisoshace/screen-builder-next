import { twMerge } from "tailwind-merge";

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const trimTo50 = (s: string) =>
  s.length > 50 ? s.slice(0, 50) + "..." : s;
