/**
 * Safely parses a date string into a Date object
 * @param dateStr - Date string to parse
 * @returns Date object or current date if parsing fails
 */
export function safeParseDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  
  try {
    const date = new Date(dateStr);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateStr}, using current date`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}