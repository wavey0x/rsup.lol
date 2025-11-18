/**
 * Address and Hash Utility Functions
 * Centralized functions for formatting Ethereum addresses and transaction hashes
 */

/**
 * Abbreviates an Ethereum address to show first and last few characters
 * @param addr - Full Ethereum address
 * @param startChars - Number of characters to show at start (default: 5 including 0x)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Abbreviated address like "0xca8...4ed7" or empty string if invalid
 */
export function abbreviateAddress(
  addr: string,
  startChars: number = 5,
  endChars: number = 4
): string {
  if (!addr || typeof addr !== "string") return "";
  if (addr.length < startChars + endChars) return addr;
  return `${addr.slice(0, startChars)}...${addr.slice(-endChars)}`;
}

/**
 * Abbreviates a transaction hash
 * @param hash - Full transaction hash
 * @param startChars - Number of characters to show at start (default: 5 including 0x)
 * @param endChars - Number of characters to show at end (default: 3)
 * @returns Abbreviated hash like "0x448...50b" or empty string if invalid
 */
export function abbreviateHash(
  hash: string,
  startChars: number = 5,
  endChars: number = 3
): string {
  if (!hash || typeof hash !== "string") return "";
  if (hash.length < startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}..${hash.slice(-endChars)}`;
}

/**
 * Checks if a string is a valid Ethereum address format
 * @param addr - String to validate
 * @returns true if valid format (0x followed by 40 hex characters)
 */
export function isValidAddress(addr: string): boolean {
  if (!addr || typeof addr !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * Checks if a string is a valid transaction hash format
 * @param hash - String to validate
 * @returns true if valid format (0x followed by 64 hex characters)
 */
export function isValidHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
