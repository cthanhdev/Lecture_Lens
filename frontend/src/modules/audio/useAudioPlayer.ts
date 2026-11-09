import { createContext, useContext } from 'react'

export interface LectureAudioTrack {
  id: string
  title: string
  subject: string
  duration: number
  audioUrl?: string
}

export interface AudioContextType {
  currentTrack: LectureAudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  play: (track?: LectureAudioTrack) => void
  pause: () => void
  togglePlay: () => void
  seek: (seconds: number) => void
  setRate: (rate: number) => void
}

export const AudioContext = createContext<AudioContextType | null>(null)

export function useAudioPlayer(): AudioContextType {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioProvider')
  }
  return context
}
