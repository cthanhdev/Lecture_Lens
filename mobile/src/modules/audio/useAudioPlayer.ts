import { createContext, useContext } from 'react'
import type { AudioContextType } from './types'

export const AudioContext = createContext<AudioContextType | null>(null)

export function useAudioPlayer(): AudioContextType {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioProvider')
  }
  return context
}
