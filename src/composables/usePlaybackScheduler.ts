import { onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { usePlayerAdapter } from '@/composables/usePlayerAdapter'

export function usePlaybackScheduler() {
  const store = usePlayerStore()
  const { adapter } = usePlayerAdapter()
  let intervalId: number | null = null

  function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  function checkSchedule() {
    if (!store.schedulerEnabled) return

    // Use Guatemala Time Zone
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Guatemala',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
      hour12: false,
    }

    // Format: "3, 16:05" (Day, Hour:Minute) - format varies by locale, so we parse parts
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now)

    let day = 0
    let hour = 0
    let minute = 0

    // Extract parts safely
    const dayPart = parts.find(p => p.type === 'weekday')
    // weekday in en-US is "Monday", "Tuesday", etc. We need to map to 0-6
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }
    if (dayPart) day = dayMap[dayPart.value] ?? 0

    const hourPart = parts.find(p => p.type === 'hour')
    if (hourPart) hour = parseInt(hourPart.value, 10)

    const minutePart = parts.find(p => p.type === 'minute')
    if (minutePart) minute = parseInt(minutePart.value, 10)

    // Handle 24h format edge case (24:00 -> 00:00) if necessary, but hour12: false usually gives 0-23
    if (hour === 24) hour = 0

    const currentTime = hour * 60 + minute

    let start = 0
    let end = 0

    if (day >= 1 && day <= 5) {
      // Mon-Fri
      start = timeToMinutes(store.scheduleConfig.weekdays.start)
      end = timeToMinutes(store.scheduleConfig.weekdays.end)
    } else {
      // Sat-Sun
      start = timeToMinutes(store.scheduleConfig.weekends.start)
      end = timeToMinutes(store.scheduleConfig.weekends.end)
    }

    const shouldBePlaying = currentTime >= start && currentTime < end

    if (shouldBePlaying) {
      if (!store.isPlaying && store.playlist.length > 0) {
        console.log('Scheduler: Starting playback')

        // If we have a saved index and time, try to resume
        // The store initializes currentIndex/currentTime from storage, so we just need to ensure
        // we don't overwrite it if it's valid.

        if (store.currentIndex === -1) {
          store.playTrackAtIndex(0)
        } else {
          // Ensure the current track is set in the store
          const track = store.playlist[store.currentIndex]
          if (track) {
            store.setCurrentTrack(track, store.currentIndex)
          } else {
            store.playTrackAtIndex(0)
          }
        }

        // Wait for loading to finish before playing
        // We watch for isLoading to go from true -> false, or just wait for it to be false if it started
        const unwatch = watch(
          () => store.isLoading,
          (loading, prevLoading) => {
            if (!loading && prevLoading) {
              setTimeout(() => {
                adapter.play().catch(e => {
                  if (e.name === 'NotAllowedError') {
                    // Add a one-time click listener to resume playback on any interaction
                    const resumeOnInteraction = () => {
                      adapter.play()
                      document.removeEventListener('click', resumeOnInteraction)
                      document.removeEventListener('keydown', resumeOnInteraction)
                    }
                    document.addEventListener('click', resumeOnInteraction)
                    document.addEventListener('keydown', resumeOnInteraction)
                  }
                })
              }, 150)

              // Restore time if > 0
              if (store.currentTime > 0) {
                adapter.seek(store.currentTime)
              }

              unwatch() // Stop watching after first play
            }
          }
        )

        // Safety timeout: if loading takes too long or doesn't trigger, clean up watcher
        setTimeout(() => {
          unwatch()
        }, 10000)
      }
    } else {
      if (store.isPlaying) {
        console.log('Scheduler: Stopping playback (out of schedule)')
        adapter.pause()
      }
    }
  }

  // Watch for playlist changes to auto-start if schedule is active
  watch(
    () => store.playlist.length,
    newLength => {
      if (newLength > 0 && store.schedulerEnabled) {
        checkSchedule()
      }
    }
  )

  function startScheduler() {
    if (intervalId) clearInterval(intervalId)
    // Check every minute
    intervalId = window.setInterval(checkSchedule, 60000)
    // Initial check
    checkSchedule()
  }

  function stopScheduler() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // Watch for toggle changes
  watch(
    () => store.schedulerEnabled,
    enabled => {
      if (enabled) {
        startScheduler()
      } else {
        stopScheduler()
      }
    }
  )

  onMounted(() => {
    if (store.schedulerEnabled) {
      startScheduler()
    }
  })

  onUnmounted(() => {
    stopScheduler()
  })

  return {
    checkSchedule, // Exposed for debugging/testing if needed
  }
}
