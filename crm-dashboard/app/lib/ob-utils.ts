// ============================================================================
// OB (OVERTIME) COST CALCULATION UTILITY
// Calculates if OB cost applies based on:
// - Time: 18:00-07:00 (1500 SEK)
// - Day: Weekends (Saturday/Sunday)
// - Date: Swedish holidays
// ============================================================================

import { supabase } from './supabase';

// Swedish holidays (cache locally to avoid DB calls)
const SWEDISH_HOLIDAYS_2025_2026 = [
  // 2025
  '2025-01-01', '2025-01-06', '2025-04-18', '2025-04-20', '2025-04-21',
  '2025-05-01', '2025-05-09', '2025-05-19', '2025-06-06', '2025-06-21',
  '2025-11-01', '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-31',
  // 2026
  '2026-01-01', '2026-01-06', '2026-04-03', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-14', '2026-05-24', '2026-06-06', '2026-06-20',
  '2026-11-01', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31',
];

const OB_COST = 1500; // SEK

/**
 * Check if a given date is a Swedish holiday
 */
export function isSwedishHoliday(dateString: string): boolean {
  return SWEDISH_HOLIDAYS_2025_2026.includes(dateString);
}

/**
 * Check if a time is within OB hours (18:00-07:00)
 */
export function isOBHour(timeString: string): boolean {
  if (!timeString) return false;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // OB hours: 18:00 (1080 min) to 07:00 (420 min) next day
  // So: >= 18:00 OR < 07:00
  return totalMinutes >= 18 * 60 || totalMinutes < 7 * 60;
}

/**
 * Check if a date is a weekend (Saturday=6, Sunday=0)
 */
export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Calculate OB cost based on pickup and/or delivery time/date
 * Returns 1500 SEK if ANY condition matches:
 * - Pickup time is within OB hours (18:00-07:00)
 * - Pickup date is weekend or holiday
 * - Delivery time is within OB hours (18:00-07:00)
 * - Delivery date is weekend or holiday
 */
export function calculateOBCost(
  pickupDate: string,
  pickupTime: string,
  deliveryDate: string,
  deliveryTime: string
): number {
  // Check pickup conditions
  if (
    (pickupTime && isOBHour(pickupTime)) ||
    isWeekend(pickupDate) ||
    isSwedishHoliday(pickupDate)
  ) {
    return OB_COST;
  }

  // Check delivery conditions
  if (
    (deliveryTime && isOBHour(deliveryTime)) ||
    isWeekend(deliveryDate) ||
    isSwedishHoliday(deliveryDate)
  ) {
    return OB_COST;
  }

  return 0;
}

/**
 * Format time to HH:MM format
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes || '00'}`;
}

/**
 * Get OB reason (for display)
 */
export function getOBReason(
  pickupDate: string,
  pickupTime: string,
  deliveryDate: string,
  deliveryTime: string
): string[] {
  const reasons: string[] = [];

  if (pickupTime && isOBHour(pickupTime)) reasons.push('Upphämtning under OB-tid (18:00-07:00)');
  if (isWeekend(pickupDate)) reasons.push('Upphämtning på helg');
  if (isSwedishHoliday(pickupDate)) reasons.push('Upphämtning på helgdag');

  if (deliveryTime && isOBHour(deliveryTime)) reasons.push('Leverans under OB-tid (18:00-07:00)');
  if (isWeekend(deliveryDate)) reasons.push('Leverans på helg');
  if (isSwedishHoliday(deliveryDate)) reasons.push('Leverans på helgdag');

  return [...new Set(reasons)]; // Remove duplicates
}
