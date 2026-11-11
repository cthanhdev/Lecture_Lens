import React, { useState, useCallback, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { AudioContext } from './useAudioPlayer'
import type { LectureAudioTrack, AudioContextType } from './types'

// Dữ liệu audio demo mẫu ban đầu
const DEFAULT_DEMO_TRACK: LectureAudioTrack = {
  id: 'macro-101',
  title: 'Kinh Tế Vĩ Mô - Chương 3: Lạm Phát & Thất Nghiệp',
  subject: 'Kinh Tế Vĩ Mô',
  duration: 2715, // 45:15
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [currentTrack, setCurrentTrack] = useState<LectureAudioTrack | null>(DEFAULT_DEMO_TRACK)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(135) // 02:15
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)

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
