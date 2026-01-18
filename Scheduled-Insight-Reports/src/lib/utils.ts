import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateNextRunAt(now: Date, cadence: 'hourly' | 'every 12 hours' | 'daily'): string | null {

  switch (cadence) {
    case 'hourly':
      // Add 1 hour
      now.setHours(now.getHours() + 1);
      break;
    case 'every 12 hours':
      // Add 12 hours
      now.setHours(now.getHours() + 12);
      break;
    case 'daily':
      // Add 24 hours (1 full day)
      now.setDate(now.getDate() + 1);
      break;
  }

  return now.toISOString();
}