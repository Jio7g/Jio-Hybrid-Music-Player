export type TrackType = 'mp3' | 'youtube' | 'drive' | 'dropbox' | 'local'

export interface Track {
  id: string
  title: string
  artist: string
  type: TrackType
  src: string
  cover?: string
  duration?: number
}

export interface PlayerState {
  playlist: Track[]
  currentTrack: Track | null
  currentIndex: number
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  isLoading: boolean
}

export interface PlayerAdapter {
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  loadTrack: (track: Track) => Promise<void>
  setVolume: (volume: number) => void
  seek: (time: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  cleanup: () => void
}
