import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Track } from '@/types'
import api from '@/services/api'

const STORAGE_KEY_LOOP = 'hybrid-player-loop-mode'

// Load loop mode from localStorage
function loadLoopModeFromStorage(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOOP)
    return saved === 'true'
  } catch (error) {
    console.error('Error loading loop mode from storage:', error)
    return false
  }
}

export const usePlayerStore = defineStore('player', () => {
  // State
  const playlist = ref<Track[]>([])
  const currentTrack = ref<Track | null>(null)
  const currentIndex = ref<number>(-1)
  const isPlaying = ref<boolean>(false)
  const volume = ref<number>(0.7)
  const currentTime = ref<number>(0)
  const duration = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const loopMode = ref<boolean>(loadLoopModeFromStorage())
  const isSyncing = ref<boolean>(false)
  const isLoadingTracks = ref<boolean>(false)
  const trash = ref<Track[]>([])

  // Getters
  const hasNextTrack = computed(() => currentIndex.value < playlist.value.length - 1)
  const hasPreviousTrack = computed(() => currentIndex.value > 0)
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  // Actions
  async function loadTracksFromBackend() {
    try {
      isLoadingTracks.value = true
      const tracks = await api.getTracks()
      playlist.value = tracks
    } catch (error) {
      console.error('Error loading tracks from backend:', error)
    } finally {
      isLoadingTracks.value = false
    }
  }

  function setPlaylist(tracks: Track[]) {
    playlist.value = tracks
  }

  async function addTrack(track: Track) {
    try {
      const createdTrack = await api.createTrack(track)
      playlist.value.push(createdTrack)
    } catch (error) {
      console.error('Error adding track:', error)
      throw error
    }
  }

  async function removeTrack(trackId: string) {
    const index = playlist.value.findIndex(t => t.id === trackId)
    if (index !== -1) {
      try {
        await api.deleteTrack(trackId)
        playlist.value.splice(index, 1)
        if (index === currentIndex.value) {
          currentTrack.value = null
          currentIndex.value = -1
        } else if (index < currentIndex.value) {
          currentIndex.value--
        }
      } catch (error) {
        console.error('Error removing track:', error)
        throw error
      }
    }
  }

  async function downloadDropboxFile(url: string, title?: string, artist?: string) {
    try {
      const track = await api.downloadDropboxFile(url, title, artist)
      playlist.value.push(track)
      return track
    } catch (error) {
      console.error('Error downloading Dropbox file:', error)
      throw error
    }
  }


  async function scanDropboxFolder(folderUrl: string) {
    console.log('Store: scanning folder', folderUrl)
    try {
      isSyncing.value = true
      return await api.scanDropboxFolder(folderUrl)
    } catch (error) {
      console.error('Error scanning Dropbox folder:', error)
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  async function importTracks(tracks: { filename: string, url: string }[]) {
    try {
      isSyncing.value = true
      const result = await api.importTracks(tracks)
      
      // Reload tracks to get the newly added ones
      if (result.added.length > 0) {
        await loadTracksFromBackend()
      }
      
      return result
    } catch (error) {
      console.error('Error importing tracks:', error)
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  function toggleLoopMode() {
    loopMode.value = !loopMode.value
    try {
      localStorage.setItem(STORAGE_KEY_LOOP, loopMode.value.toString())
    } catch (error) {
      console.error('Error saving loop mode to storage:', error)
    }
  }

  function setCurrentTrack(track: Track | null, index: number = -1) {
    currentTrack.value = track
    currentIndex.value = index
  }

  function playTrackAtIndex(index: number) {
    if (index >= 0 && index < playlist.value.length) {
      setCurrentTrack(playlist.value[index], index)
      return playlist.value[index]
    }
    return null
  }

  function nextTrack(): Track | null {
    if (hasNextTrack.value) {
      return playTrackAtIndex(currentIndex.value + 1)
    }
    // If loop mode is enabled and we're at the end, go back to the beginning
    if (loopMode.value && playlist.value.length > 0) {
      return playTrackAtIndex(0)
    }
    return null
  }

  function previousTrack(): Track | null {
    if (hasPreviousTrack.value) {
      return playTrackAtIndex(currentIndex.value - 1)
    }
    return null
  }

  function setPlaying(playing: boolean) {
    isPlaying.value = playing
  }

  function setVolume(vol: number) {
    volume.value = Math.max(0, Math.min(1, vol))
  }

  function setCurrentTime(time: number) {
    currentTime.value = time
  }

  function setDuration(dur: number) {
    duration.value = dur
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  async function clearPlaylist() {
    try {
      await api.clearAllTracks()
      playlist.value = []
      currentTrack.value = null
      currentIndex.value = -1
      isPlaying.value = false
    } catch (error) {
      console.error('Error clearing playlist:', error)
      throw error
    }
  }

  async function loadTrash() {
    try {
      trash.value = await api.getTrash()
    } catch (error) {
      console.error('Error loading trash:', error)
    }
  }

  async function restoreTrack(trackId: string) {
    try {
      await api.restoreTrack(trackId)
      await loadTrash()
      await loadTracksFromBackend()
    } catch (error) {
      console.error('Error restoring track:', error)
      throw error
    }
  }

  async function deleteTrackPermanently(trackId: string) {
    try {
      await api.deleteTrackPermanently(trackId)
      await loadTrash()
    } catch (error) {
      console.error('Error deleting track permanently:', error)
      throw error
    }
  }

  async function emptyTrash(olderThan30Days: boolean = false) {
    try {
      await api.emptyTrash(olderThan30Days)
      await loadTrash()
    } catch (error) {
      console.error('Error emptying trash:', error)
      throw error
    }
  }

  async function scanLocalFolder() {
    try {
      isLoadingTracks.value = true
      const result = await api.scanLocalFolder()
      if (result.added > 0) {
        await loadTracksFromBackend()
      }
      return result
    } catch (error) {
      console.error('Error scanning local folder:', error)
      throw error
    } finally {
      isLoadingTracks.value = false
    }
  }

  return {
    // State
    playlist,
    currentTrack,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    isLoading,
    loopMode,
    isSyncing,
    isLoadingTracks,
    trash,
    // Getters
    hasNextTrack,
    hasPreviousTrack,
    progress,
    // Actions
    loadTracksFromBackend,
    setPlaylist,
    addTrack,
    removeTrack,
    downloadDropboxFile,
    setCurrentTrack,
    playTrackAtIndex,
    nextTrack,
    previousTrack,
    setPlaying,
    setVolume,
    setCurrentTime,
    setDuration,
    setLoading,
    clearPlaylist,
    toggleLoopMode,

    scanDropboxFolder,
    importTracks,
    loadTrash,
    restoreTrack,
    deleteTrackPermanently,
    emptyTrash,
    scanLocalFolder,
  }
})
