import { ref, watch, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import type { Track, PlayerAdapter } from '@/types'

export function usePlayerAdapter() {
  const store = usePlayerStore()
  const audioElement = ref<HTMLAudioElement | null>(null)
  const youtubePlayer = ref<YT.Player | null>(null)
  const currentAdapter = ref<'mp3' | 'youtube' | null>(null)
  const isYouTubeApiReady = ref(false)

  // Load YouTube IFrame API
  function loadYouTubeAPI(): Promise<void> {
    return new Promise(resolve => {
      if (window.YT && window.YT.Player) {
        isYouTubeApiReady.value = true
        resolve()
        return
      }

      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        isYouTubeApiReady.value = true
        resolve()
      }
    })
  }

  // Initialize audio element
  function initAudioElement() {
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.volume = store.volume

      audioElement.value.addEventListener('loadedmetadata', () => {
        store.setDuration(audioElement.value?.duration || 0)
        store.setLoading(false)
      })

      audioElement.value.addEventListener('timeupdate', () => {
        store.setCurrentTime(audioElement.value?.currentTime || 0)
      })

      audioElement.value.addEventListener('ended', () => {
        handleTrackEnd()
      })

      audioElement.value.addEventListener('play', () => {
        store.setPlaying(true)
      })

      audioElement.value.addEventListener('pause', () => {
        store.setPlaying(false)
      })

      audioElement.value.addEventListener('error', () => {
        store.setLoading(false)
        console.error('Error loading audio')
      })
    }
  }

  // Initialize YouTube player
  async function initYouTubePlayer(videoId: string): Promise<void> {
    await loadYouTubeAPI()

    return new Promise((resolve, reject) => {
      // Destroy existing player first
      if (youtubePlayer.value) {
        try {
          youtubePlayer.value.destroy()
        } catch (e) {
          console.warn('Error destroying previous player:', e)
        }
        youtubePlayer.value = null
      }

      // Create or get player container
      let container = document.getElementById('youtube-player-container')
      if (!container) {
        container = document.createElement('div')
        container.id = 'youtube-player-container'
        // Position it at the bottom right, barely visible but not hidden
        container.style.position = 'fixed'
        container.style.bottom = '100px'
        container.style.right = '20px'
        container.style.width = '320px'
        container.style.height = '180px'
        container.style.zIndex = '9999'
        container.style.border = '2px solid #0ea5e9'
        container.style.borderRadius = '8px'
        container.style.overflow = 'hidden'
        container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'
        document.body.appendChild(container)
      }

      // Clear the container and create iframe container
      container.innerHTML = ''
      const iframeContainer = document.createElement('div')
      iframeContainer.id = 'youtube-player'
      container.appendChild(iframeContainer)

      try {
        youtubePlayer.value = new YT.Player('youtube-player', {
          height: '180',
          width: '320',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: event => {
              console.log('YouTube player ready for video:', videoId)
              event.target.setVolume(store.volume * 100)
              const duration = event.target.getDuration()
              store.setDuration(duration)
              store.setLoading(false)
              resolve()
            },
            onStateChange: event => {
              if (event.data === YT.PlayerState.PLAYING) {
                store.setPlaying(true)
                startYouTubeTimeUpdater()
              } else if (event.data === YT.PlayerState.PAUSED) {
                store.setPlaying(false)
              } else if (event.data === YT.PlayerState.ENDED) {
                handleTrackEnd()
              }
            },
            onError: error => {
              store.setLoading(false)
              console.error('Error loading YouTube video:', error)
              reject(new Error('Failed to load YouTube video'))
            },
          },
        })
      } catch (error) {
        store.setLoading(false)
        console.error('Error initializing YouTube player:', error)
        reject(error)
      }
    })
  }

  // YouTube time updater
  let youtubeInterval: number | null = null
  function startYouTubeTimeUpdater() {
    if (youtubeInterval) clearInterval(youtubeInterval)
    youtubeInterval = window.setInterval(() => {
      if (youtubePlayer.value && store.isPlaying) {
        store.setCurrentTime(youtubePlayer.value.getCurrentTime())
      }
    }, 100)
  }

  // Handle track end
  function handleTrackEnd() {
    const nextTrack = store.nextTrack()
    if (nextTrack) {
      loadTrack(nextTrack).then(() => play())
    } else {
      store.setPlaying(false)
      store.setCurrentTime(0)
    }
  }

  // Extract YouTube video ID from URL
  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  // Extract file ID from Google Drive URL
  function extractDriveFileId(url: string): string | null {
    // Handle different Google Drive URL formats

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const viewMatch = url.match(/\/file\/d\/([^/]+)/)
    if (viewMatch && viewMatch[1]) {
      return viewMatch[1]
    }

    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([^&]+)/)
    if (openMatch && openMatch[1]) {
      return openMatch[1]
    }

    // Format: https://drive.google.com/uc?id=FILE_ID
    const ucMatch = url.match(/\/uc\?.*id=([^&]+)/)
    if (ucMatch && ucMatch[1]) {
      return ucMatch[1]
    }

    // No pattern matched
    return null
  }

  // Convert Dropbox URL to direct download URL
  function convertDropboxUrl(url: string): string {
    // Change ?dl=0 to ?dl=1 for direct download
    // Also handle www.dropbox.com vs dl.dropboxusercontent.com
    let directUrl = url.replace(/\?dl=0/, '?dl=1')
    directUrl = directUrl.replace(/\&dl=0/, '&dl=1')

    // If no dl parameter, add it
    if (!directUrl.includes('?dl=')) {
      directUrl += url.includes('?') ? '&dl=1' : '?dl=1'
    }

    return directUrl
  }

  // Adapter methods
  async function loadTrack(track: Track): Promise<void> {
    try {
      store.setLoading(true)
      cleanup()

      if (track.type === 'mp3' || track.type === 'local') {
        currentAdapter.value = 'mp3'
        initAudioElement()
        if (audioElement.value) {
          const apiBaseUrl =
            import.meta.env.VITE_API_URL ||
            (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')
          const backendBaseUrl = apiBaseUrl.replace('/api', '')
          const audioSrc =
            track.type === 'local' && track.src.startsWith('/music/')
              ? `${backendBaseUrl}${track.src}`
              : track.src
          console.log('Loading audio:', audioSrc)
          audioElement.value.src = audioSrc
          audioElement.value.load()
        }
      } else if (track.type === 'drive') {
        currentAdapter.value = 'mp3'
        initAudioElement()
        if (audioElement.value) {
          // Extract file ID and create proper streaming URL
          const fileId = extractDriveFileId(track.src)
          if (fileId) {
            // Use the streaming-friendly URL format
            const streamUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
            console.log('Loading Google Drive audio with ID:', fileId)

            // Set crossOrigin to anonymous to handle CORS
            audioElement.value.crossOrigin = 'anonymous'
            audioElement.value.src = streamUrl

            // Add error handling for CORS issues
            audioElement.value.onerror = () => {
              console.error('Error loading from Google Drive, trying alternative method...')
              // Fallback: try without crossOrigin
              if (audioElement.value) {
                audioElement.value.crossOrigin = null
                audioElement.value.src = streamUrl
                audioElement.value.load()
              }
            }

            audioElement.value.load()
          } else {
            throw new Error('Could not extract file ID from Google Drive URL')
          }
        }
      } else if (track.type === 'dropbox') {
        currentAdapter.value = 'mp3'
        initAudioElement()
        if (audioElement.value) {
          const directUrl = convertDropboxUrl(track.src)
          console.log('Loading Dropbox audio:', directUrl)
          audioElement.value.src = directUrl
          audioElement.value.load()
        }
      } else if (track.type === 'youtube') {
        currentAdapter.value = 'youtube'
        const videoId = extractYouTubeId(track.src)
        if (videoId) {
          console.log('Loading YouTube video:', videoId)
          await initYouTubePlayer(videoId)
        } else {
          throw new Error('Invalid YouTube URL')
        }
      }
    } catch (error) {
      store.setLoading(false)
      console.error('Error loading track:', error)
      throw error
    }
  }

  async function play(): Promise<void> {
    try {
      if (currentAdapter.value === 'mp3' && audioElement.value) {
        await audioElement.value.play()
      } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
        youtubePlayer.value.playVideo()
      }
    } catch (error) {
      console.error('Error playing track:', error)
    }
  }

  function pause(): void {
    if (currentAdapter.value === 'mp3' && audioElement.value) {
      audioElement.value.pause()
    } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
      youtubePlayer.value.pauseVideo()
    }
  }

  function stop(): void {
    pause()
    seek(0)
  }

  function setVolume(volume: number): void {
    const vol = Math.max(0, Math.min(1, volume))
    store.setVolume(vol)

    if (currentAdapter.value === 'mp3' && audioElement.value) {
      audioElement.value.volume = vol
    } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
      youtubePlayer.value.setVolume(vol * 100)
    }
  }

  function seek(time: number): void {
    if (currentAdapter.value === 'mp3' && audioElement.value) {
      audioElement.value.currentTime = time
    } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
      youtubePlayer.value.seekTo(time, true)
    }
    store.setCurrentTime(time)
  }

  function getCurrentTime(): number {
    if (currentAdapter.value === 'mp3' && audioElement.value) {
      return audioElement.value.currentTime
    } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
      return youtubePlayer.value.getCurrentTime()
    }
    return 0
  }

  function getDuration(): number {
    if (currentAdapter.value === 'mp3' && audioElement.value) {
      return audioElement.value.duration
    } else if (currentAdapter.value === 'youtube' && youtubePlayer.value) {
      return youtubePlayer.value.getDuration()
    }
    return 0
  }

  function cleanup(): void {
    if (youtubeInterval) {
      clearInterval(youtubeInterval)
      youtubeInterval = null
    }
  }

  // Watch for volume changes
  watch(
    () => store.volume,
    newVolume => {
      setVolume(newVolume)
    }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.src = ''
    }
    if (youtubePlayer.value) {
      youtubePlayer.value.destroy()
    }
  })

  const adapter: PlayerAdapter = {
    play,
    pause,
    stop,
    loadTrack,
    setVolume,
    seek,
    getCurrentTime,
    getDuration,
    cleanup,
  }

  return {
    adapter,
    currentAdapter,
  }
}
