// src/lib/pricingEngine.ts
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  getDay, // 0 = Sunday, 6 = Saturday
  getMonth, // 0 = Jan, 11 = Dec
  getDate, // 1 - 31
} from 'date-fns';
import type { PriceBreakdown } from '../data/data';

// --- HELPER FUNCTIONS ---

/**
 * Gets a mock seasonal modifier.
 * e.g., December (month 11) is peak season, June (month 5) is low season.
 */
const getSeasonalModifier = (date: Date): number => {
  const month = getMonth(date); // 0 = Jan, 11 = Dec

  // Peak season (Dec, Jan)
  if (month === 11 || month === 0) {
    return 0.25; // +25%
  }
  // Low season (June, July, Aug)
  if (month >= 5 && month <= 7) {
    return -0.15; // -15%
  }
  // Default/Shoulder season
  return 0.0;
};

/**
 * Gets a mock day-of-week modifier.
 * e.g., Friday (5) and Saturday (6) are weekends.
 */
const getDayOfWeekModifier = (date: Date): number => {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday

  // Weekend (Fri or Sat)
  if (day === 5 || day === 6) {
    return 0.15; // +15%
  }
  // Default/Weekday
  return 0.0;
};

/**
 * (NEW) Gets a mock holiday modifier.
 */
const getHolidayModifier = (date: Date): number => {
  const month = getMonth(date); // 0-11
  const day = getDate(date); // 1-31

  // Christmas (Dec 24-26)
  if (month === 11 && day >= 24 && day <= 26) {
    return 0.40; // +40%
  }
  // New Year (Dec 31 - Jan 1)
  if ((month === 11 && day === 31) || (month === 0 && day === 1)) {
    return 0.50; // +50%
  }
  return 0.0;
};

/**
 * (NEW) Gets a mock local event modifier.
 */
const getLocalEventModifier = (date: Date): number => {
  const month = getMonth(date);
  const day = getDate(date);

  // Mock "City Marathon" - first weekend of March
  if (
    month === 2 &&
    day >= 1 &&
    day <= 7 &&
    (getDay(date) === 6 || getDay(date) === 0)
  ) {
    return 0.30; // +30%
  }
  return 0.0;
};

/**
 * (NEW) Gets a mock "demand" modifier.
 * This is deterministic (same date always has same modifier)
 * to simulate random daily demand fluctuations.
 */
const getDemandModifier = (date: Date): number => {
  // Simulate a "random" but deterministic demand (0% - 10%)
  // based on the day of the month.
  const demand = (date.getDate() % 11) / 100.0; // 0.00 to 0.10
  return demand;
};

// --- CONSTANTS ---
const TAX_RATE = 0.18; // 18% Tax
const SERVICE_FEE = 500; // 500 INR flat fee

// --- MAIN PRICING FUNCTION (UPDATED) ---

/**
 * Calculates a dynamic price breakdown based on dates and modifiers.
 * @param basePrice The hotel's base price per night
 * @param checkIn The check-in date
 * @param checkOut The check-out date
 * @param currency The currency code (e.g., "INR")
 * @returns A full PriceBreakdown object
 */
export const calculatePrice = (
  basePrice: number,
  checkIn: Date,
  checkOut: Date,
  currency: string
): PriceBreakdown => {
  const nights = differenceInCalendarDays(checkOut, checkIn);

  // Ensure we have at least 1 night
  if (nights <= 0) {
    return {
      nights: 0,
      base_price_per_night: basePrice,
      subtotal: 0,
      seasonal_mod: 0,
      taxes: 0,
      service_fee: 0,
      total: 0,
      currency: currency,
    };
  }

  // Get an array of all dates for the stay, excluding the checkout date
  const stayDates = eachDayOfInterval({
    start: checkIn,
    end: new Date(checkOut.getTime() - 1), // Get all days *in* the stay
  });

  let calculatedSubtotal = 0;
  let totalModifierValue = 0;

  // Calculate the price for each night
  for (const date of stayDates) {
    // --- (NEW) Get all modifiers ---
    const seasonalMod = getSeasonalModifier(date);
    const dayOfWeekMod = getDayOfWeekModifier(date);
    const holidayMod = getHolidayModifier(date);
    const eventMod = getLocalEventModifier(date);
    const demandMod = getDemandModifier(date);

    // Get the total modifier for this specific night
    const totalMod =
      1 + seasonalMod + dayOfWeekMod + holidayMod + eventMod + demandMod;
    const nightlyPrice = basePrice * totalMod;

    calculatedSubtotal += nightlyPrice;

    // Track the total *value* added by modifiers
    // (The 'seasonal_mod' field in PriceBreakdown is used to store ALL adjustments)
    totalModifierValue += nightlyPrice - basePrice;
  }

  const calculatedTaxes = calculatedSubtotal * TAX_RATE;
  const calculatedTotal = calculatedSubtotal + calculatedTaxes + SERVICE_FEE;

  return {
    nights: nights,
    base_price_per_night: basePrice, // The original base price
    subtotal: Math.round(calculatedSubtotal),
    seasonal_mod: Math.round(totalModifierValue), // This is the total value of all mods
    taxes: Math.round(calculatedTaxes),
    service_fee: SERVICE_FEE,
    total: Math.round(calculatedTotal),
    currency: currency,
  };
};