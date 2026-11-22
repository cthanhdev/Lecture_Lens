import React, { useState, useCallback, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { AudioContext } from './useAudioPlayer'
import type { LectureAudioTrack, AudioContextType } from './types'

// Default demo track synchronized with Screens 08-12 (Study Hub & Library)
const DEFAULT_DEMO_TRACK: LectureAudioTrack = {
  id: 'lecture-7-macro',
  title: 'Lecture 7: Inflation & Monetary Policy',
  subject: 'Macroeconomics',
  duration: 2900, // 48:20
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [currentTrack, setCurrentTrack] = useState<LectureAudioTrack | null>(DEFAULT_DEMO_TRACK)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(1798) // 29:58
  const [playbackRate, setPlaybackRate] = useState<number>(1.25)

  const duration = currentTrack?.duration ?? 0

  // Tự động tạm dừng âm thanh khi người dùng vào phòng ghi âm trực tiếp /audio/record (Định luật 5)
  const isRecordingRoute = pathname.includes('/record')
  const effectiveIsPlaying = isPlaying && !isRecordingRoute

  const play = useCallback((track?: LectureAudioTrack) => {
    if (track) {
      setCurrentTrack(track)
      setCurrentTime(0)
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
