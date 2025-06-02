/**
 * Formats a number with appropriate abbreviation (k, M, B, etc.)
 * Never shows more than 3 total digits
 * Examples:
 * 1,000,000 -> 1.0M
 * 1,000 -> 1.0k
 * 100 -> 100
 * 1,234,567 -> 1.2M
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

  // Format to show at most 3 total digits
  if (suffixIndex === 0) {
    // For numbers less than 1000, show as is
    return Math.round(scaledValue).toString();
  } else {
    // For larger numbers, round to 1 decimal place if needed
    const rounded = Math.round(scaledValue * 10) / 10;
    return rounded.toString() + suffixes[suffixIndex];
  }
}
