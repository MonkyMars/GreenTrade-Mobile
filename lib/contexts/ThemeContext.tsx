import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'

type ThemeType = 'light' | 'dark'

interface ThemeContextType {
	theme: ThemeType
	isDark: boolean
	colors: typeof lightColors | typeof darkColors
}

// Color palette for light mode
export const lightColors = {
	background: '#f9fafb',
	card: '#ffffff',
	text: '#111827',
	textSecondary: '#4b5563',
	textTertiary: '#6b7280',
	border: '#e5e7eb',
	borderLight: 'rgba(229, 231, 235, 0.6)',
	primary: '#16a34a',
	primaryLight: '#dcfce7',
	primaryDark: '#065f46',
	highlight: '#ecfdf5',
	shadow: '#000',
	rating: '#facc15',
	error: '#ef4444',
	filterBackground: 'rgba(0,0,0,0.5)',
}

// Color palette for dark mode - using colors from the web version
export const darkColors = {
	background: '#111827', // gray-900
	card: '#1f2937', // gray-800
	text: '#f9fafb', // gray-50
	textSecondary: '#d1d5db', // gray-300
	textTertiary: '#9ca3af', // gray-400
	border: '#374151', // gray-700
	borderLight: 'rgba(55, 65, 81, 0.6)', // gray-700 with opacity
	primary: '#10b981', // green-500
	primaryLight: '#064e3b', // green-900
	primaryDark: '#d1fae5', // green-100
	highlight: '#065f46', // green-800
	shadow: '#000',
	rating: '#facc15', // yellow-400
	error: '#f87171', // red-400
	filterBackground: 'rgba(0,0,0,0.7)',
}

const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	isDark: false,
	colors: lightColors,
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const colorScheme = useColorScheme()
	const [theme, setTheme] = useState<ThemeType>(
		colorScheme === 'dark' ? 'dark' : 'light',
	)

	// Update theme when system preference changes
	useEffect(() => {
		setTheme(colorScheme === 'dark' ? 'dark' : 'light')
	}, [colorScheme])

	const isDark = theme === 'dark'
	const colors = isDark ? darkColors : lightColors

	return (
		<ThemeContext.Provider value={{ theme, isDark, colors }}>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => useContext(ThemeContext)

export default ThemeContext