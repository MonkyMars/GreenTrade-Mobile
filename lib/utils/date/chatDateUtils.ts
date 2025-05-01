// Utility functions for handling dates in the chat

/**
 * Safely parses date inputs into a valid Date object
 * Handles various input types and returns a valid date or fallback
 */
export const safeParseDate = (dateInput: string | number | Date): Date => {
  // If it's already a Date, return it
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput
  }

  try {
    const parsedDate = new Date(dateInput)
    // Check if the date is valid
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  } catch (error) {
    console.warn('Invalid date input:', dateInput, error)
    // Return current date as fallback
    return new Date()
  }
}

/**
 * Formats a date for chat message dividers (Today, Yesterday, or date)
 */
export const formatDateForDivider = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const messageDate = safeParseDate(date)
  messageDate.setHours(0, 0, 0, 0)

  if (messageDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year:
        messageDate.getFullYear() !== today.getFullYear()
          ? 'numeric'
          : undefined,
    })
  }
}

/**
 * Formats a timestamp into a readable format (today, yesterday, day, or date)
 */
export const formatTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - safeParseDate(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Today, show time
    return safeParseDate(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday'
  } else if (diffDays < 7) {
    // This week, show day of week
    return safeParseDate(date).toLocaleDateString([], { weekday: 'short' })
  } else {
    // Older, show date
    return safeParseDate(date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  }
}

/**
 * Add a date to the device calendar
 */
export const addToCalendar = (dateString: string): void => {
  try {
    const date = safeParseDate(dateString)
    // Format for calendar URL
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    // Create a calendar event URL
    // This uses standard URI format that works across platforms
    const title = encodeURIComponent('Meeting from GreenTrade')
    const details = encodeURIComponent('Meeting scheduled via GreenTrade Chat')
    const startDate = `${year}${month}${day}T${hours}${minutes}00`
    const endDate = `${year}${month}${day}T${(parseInt(hours) + 1).toString().padStart(2, '0')}${minutes}00`

    let calendarUrl = ''

    if (Platform.OS === 'ios') {
      // iOS uses calshow: URL scheme
      calendarUrl = `calshow:${date.getTime()}`
    } else {
      // Android uses intent with calendar provider
      calendarUrl = `content://com.android.calendar/time/${date.getTime()}`
    }

    // Open the calendar app
    Linking.openURL(calendarUrl).catch(err => {
      console.error('Error opening calendar:', err)

      // Fallback to creating a new event if direct opening fails
      const fallbackUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startDate}/${endDate}`
      Linking.openURL(fallbackUrl).catch(err => {
        Alert.alert(
          'Calendar Error',
          'Could not open calendar app. Please add this event manually.',
        )
      })
    })
  } catch (error) {
    console.error('Error adding to calendar:', error)
    Alert.alert('Calendar Error', 'Could not add event to calendar')
  }
}

// Add the Platform and Alert imports
import { Platform, Alert, Linking } from 'react-native'
