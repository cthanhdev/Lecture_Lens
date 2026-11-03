import { create } from 'zustand';

interface AudioPlayerState {
  currentLectureId: string | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  playbackRate: number; // 1.0, 1.25, 1.5, 2.0
  setLecture: (id: string, duration: number, startSeconds?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  currentLectureId: 'lec_01',
  isPlaying: false,
  positionSeconds: 1420,
  durationSeconds: 5640,
  playbackRate: 1.0,

  setLecture: (id, duration, startSeconds = 0) =>
    set({
      currentLectureId: id,
      durationSeconds: duration,
      positionSeconds: startSeconds,
      isPlaying: true,
    }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seekTo: (seconds) => {
    const { durationSeconds } = get();
    const clamped = Math.max(0, Math.min(seconds, durationSeconds));
    set({ positionSeconds: clamped });
  },

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  skipForward: (seconds = 30) => {
    const { positionSeconds, durationSeconds } = get();
    set({ positionSeconds: Math.min(positionSeconds + seconds, durationSeconds) });
  },

  skipBackward: (seconds = 10) => {
    const { positionSeconds } = get();
    set({ positionSeconds: Math.max(positionSeconds - seconds, 0) });
  },
}));
