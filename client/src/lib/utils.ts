import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert time slot from stored format (HH:MM) to display format
 * @param timeSlot - Time in HH:MM format (e.g., "09:00", "11:00")
 * @returns Formatted time slot (e.g., "9-11am", "11am-1pm")
 */
export function formatTimeSlot(timeSlot: string): string {
  // Default time slot mapping
  const defaultTimeSlotMap: { [key: string]: string } = {
    "09:00": "9-11am",
    "11:00": "11am-1pm", 
    "13:00": "1-3pm",
    "15:00": "3-5pm",
    "17:00": "5-7pm",
    "19:00": "7-9pm"
  };
  
  // Try to get from settings first, fallback to default mapping
  return defaultTimeSlotMap[timeSlot] || timeSlot;
}
