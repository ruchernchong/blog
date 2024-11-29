/**
 * Truncates a string to a specified maximum length and adds an ellipsis if truncated.
 *
 * @param str - The input string to truncate
 * @param maxLength - Maximum length of the output string (default: 160 characters)
 * @returns The truncated string with ellipsis if truncated, or the original string if shorter than maxLength
 *
 * @example
 * truncate("This is a long string", 10) // Returns "This is..."
 * truncate("Short", 10) // Returns "Short"
 */
export const truncate = (str: string, maxLength: number = 160) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, 157) + "...";
};
