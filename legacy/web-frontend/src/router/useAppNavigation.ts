import { createContext, useContext } from 'react'
import type { AppNavigator } from './types.ts'

export const NavigationContext = createContext<AppNavigator | null>(null)

export function useAppNavigation(): AppNavigator {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider')
  }
  return context
}
