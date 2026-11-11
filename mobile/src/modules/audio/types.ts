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
