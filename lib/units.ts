export const CONVERSION_TO_BASE: Record<string, Record<string, number>> = {
  // Weight: base = g
  g: { g: 1, kg: 1000 },
  kg: { g: 0.001, kg: 1 },
  // Volume: base = mL
  mL: { mL: 1, L: 1000 },
  L: { mL: 0.001, L: 1 },
  // Count
  unit: { unit: 1 },
};

/**
 * Gets the compatible units that can be selected for a product given its base unit.
 */
export function getCompatibleUnits(baseUnit: string): string[] {
  if (baseUnit === "g" || baseUnit === "kg") {
    return ["g", "kg"];
  }
  if (baseUnit === "mL" || baseUnit === "L") {
    return ["mL", "L"];
  }
  return ["unit"];
}

/**
 * Returns the conversion factor from the ordered unit to the base unit.
 * Example: if baseUnit is 'g' and orderedUnit is 'kg', returns 1000.
 */
export function getConversionFactor(baseUnit: string, orderedUnit: string): number {
  const baseMap = CONVERSION_TO_BASE[baseUnit];
  if (!baseMap) return 1;
  const factor = baseMap[orderedUnit];
  return factor ?? 1;
}

/**
 * Helper to format a number into INR currency (English India format).
 */
export function formatINR(amount: number | string | { toNumber(): number }): string {
  let val = 0;
  if (typeof amount === "number") {
    val = amount;
  } else if (typeof amount === "string") {
    val = parseFloat(amount);
  } else if (amount && typeof amount.toNumber === "function") {
    val = amount.toNumber();
  }
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4, // Allow extra decimal precision if needed
  }).format(val);
}
