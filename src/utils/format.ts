// src/utils/format.ts

/**
 * Restrict a decimal string to the given number of decimals.
 */
export function restrictDecimals(value: string, decimals: number): string {
  if (!value) return value;

  const [whole, frac = ""] = value.split(".");

  if (frac.length > decimals) {
    return `${whole}.${frac.slice(0, decimals)}`;
  }

  return value;
}

/**
 * Sanitize input to allow only numbers and one decimal point,
 * and restrict it to the given number of decimals.
 */
export function sanitizeInput(value: string, decimals: number): string {
  // allow only digits + dot
  value = value.replace(/[^0-9.]/g, "");

  // only one dot
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  return restrictDecimals(value, decimals);
}


export function toBaseUnits(value: string, decimals: number): bigint {
  if (!value) return BigInt(0);
  console.log(" => value : ",value)
  console.log(" => decimals : ",decimals)


  const [whole, frac = ""] = value.split(".");

  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  console.log(" => base : ",whole + fracPadded)
  console.log(" => BigInt(base) : ",BigInt(whole + fracPadded))

  return BigInt(whole + fracPadded);
}

export function fromBaseUnits(value: bigint, decimals: number): string {
  const s = value.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals) || "0";
  const frac = s.slice(-decimals).replace(/0+$/, "");

  return frac ? `${whole}.${frac}` : whole;
}
