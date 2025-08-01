/**
 * Formats a number with appropriate abbreviation (k, M, B, etc.)
 * Always shows exactly 3 digits
 * Examples:
 * 1,000,000 -> 1.23M
 * 1,000 -> 1.00k
 * 100 -> 100
 * 1,234,567 -> 1.23M
 * 248,130 -> 248k
 */
export function formatNumberWithAbbreviation(value: number): string {
  if (value === 0) return "0";

  const absValue = Math.abs(value);
  const suffixes = ["", "k", "M", "B", "T"];
  const suffixIndex = Math.min(
    Math.floor(Math.log10(absValue) / 3),
    suffixes.length - 1
  );

  const scaledValue = value / Math.pow(1000, suffixIndex);

  // Format to show exactly 3 digits
  if (suffixIndex === 0) {
    // For numbers less than 1000, show as is
    return Math.round(scaledValue).toString();
  } else {
    // For larger numbers, ensure we show exactly 3 digits
    const digits = Math.floor(Math.log10(Math.abs(scaledValue))) + 1;
    const decimals = Math.max(0, 3 - digits);
    return scaledValue.toFixed(decimals) + suffixes[suffixIndex];
  }
}

/**
 * Formats a percentage with appropriate abbreviation for large values
 * Examples:
 * 100% -> 100%
 * 1000% -> 1.00k%
 * 1500000% -> 1.50M%
 * 99.5% -> 99.5%
 * >1T -> ∞%
 */
export function formatPercentWithAbbreviation(value: number): string {
  if (value === 0) return "0%";
  if (value === 100) return "100%";

  // For percentages >= 1000, apply abbreviation logic
  if (value >= 1000) {
    const absValue = Math.abs(value);

    // If over 1 trillion, use infinity symbol
    if (absValue >= 1e12) {
      return "∞%";
    }

    const suffixes = ["", "k", "M", "B", "T"];
    const suffixIndex = Math.min(
      Math.floor(Math.log10(absValue) / 3),
      suffixes.length - 1
    );

    const scaledValue = value / Math.pow(1000, suffixIndex);

    // Format to show exactly 3 digits
    if (suffixIndex === 0) {
      return Math.round(scaledValue).toString() + "%";
    } else {
      const digits = Math.floor(Math.log10(Math.abs(scaledValue))) + 1;
      const decimals = Math.max(0, 3 - digits);
      return scaledValue.toFixed(decimals) + suffixes[suffixIndex] + "%";
    }
  }

  // For percentages < 1000, use the existing logic
  if (value >= 10) return value.toFixed(1) + "%";
  if (value > 0) return value.toFixed(2) + "%";
  return "0.00%";
}

export function formatPercent3Digits(value: number): string {
  if (value === 100) return "100%";
  if (value >= 10) return value.toFixed(1) + "%";
  if (value > 0) return value.toFixed(2) + "%";
  return "0.00%";
}
