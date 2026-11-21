import React, { useState, useCallback, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { AudioContext } from './useAudioPlayer'
import type { LectureAudioTrack, AudioContextType } from './types'

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [currentTrack, setCurrentTrack] = useState<LectureAudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)

  const duration = currentTrack?.duration ?? 0

  // Tự động tạm dừng âm thanh khi người dùng vào phòng ghi âm trực tiếp /audio/record (Định luật 5)
  const isRecordingRoute = pathname.includes('/record')
  const effectiveIsPlaying = isPlaying && !isRecordingRoute

  const play = useCallback((track?: LectureAudioTrack, startAt?: number) => {
    if (track) {
      setCurrentTrack(track)
      setCurrentTime(startAt !== undefined ? Math.max(0, startAt) : 0)
    } else if (startAt !== undefined) {
      setCurrentTime(Math.max(0, startAt))
    }
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const seek = useCallback((seconds: number) => {
    setCurrentTime(seconds)
  }, [])

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate)
  }, [])

  const value: AudioContextType = {
    currentTrack,
    isPlaying: effectiveIsPlaying,
    currentTime,
    duration,
    playbackRate,
    play,
    pause,
    togglePlay,
    seek,
    setRate,
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}
