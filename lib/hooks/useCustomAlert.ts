import { useState, useCallback } from 'react'

interface AlertOptions {
  title: string
  message: string
  buttons?: {
    text: string
    onPress: () => void
    style?: 'default' | 'cancel' | 'destructive'
  }[]
  type?: 'success' | 'error' | 'warning' | 'info'
}

export const useCustomAlert = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [config, setConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  })

  const showAlert = useCallback((options: AlertOptions) => {
    // Process the buttons to ensure they close the alert when pressed
    const processedButtons = options.buttons?.map(button => ({
      ...button,
      onPress: () => {
        setIsVisible(false)
        button.onPress()
      },
    }))

    setConfig({
      ...options,
      buttons: processedButtons || [],
    })
    setIsVisible(true)
  }, [])

  const hideAlert = useCallback(() => {
    setIsVisible(false)
  }, [])

  return {
    isVisible,
    config,
    showAlert,
    hideAlert,
  }
}
