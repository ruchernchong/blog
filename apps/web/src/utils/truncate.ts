/**
 * Truncates a string to a specified maximum length and appends an ellipsis ("...") if the string exceeds that length.
 *
 * @param str - The input string to truncate
 * @param maxLength - The maximum allowable length of the output string, including the ellipsis (default is 160 characters)
 * @returns If the input string length exceeds maxLength, returns a truncated string with "..." appended. Otherwise, returns the original string.
 *
 * @example
 * truncate("This is a long string", 10) // Returns "This is..."
 * truncate("Short", 10) // Returns "Short"
 */
const truncate = (str: string, maxLength = 160): string => {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
};

export default truncate;
