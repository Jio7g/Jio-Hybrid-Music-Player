<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/player'
import { getPlayerAdapter } from '@/services/playerService'

const store = usePlayerStore()
const { adapter } = getPlayerAdapter()
const { t } = useI18n()

// Computed
const progressPercentage = computed(() => store.progress)
const volumePercentage = computed(() => store.volume * 100)

// Format time (seconds to mm:ss)
function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Control methods
async function togglePlayPause() {
  if (!store.currentTrack) return

  if (store.isPlaying) {
    adapter.pause()
  } else {
    await adapter.play()
  }
}

async function playNext() {
  const nextTrack = store.nextTrack()
  if (nextTrack) {
    try {
      await adapter.loadTrack(nextTrack)
      await adapter.play()
    } catch (error) {
      console.error('Error playing next track:', error)
    }
  }
}

async function playPrevious() {
  const prevTrack = store.previousTrack()
  if (prevTrack) {
    try {
      await adapter.loadTrack(prevTrack)
      await adapter.play()
    } catch (error) {
      console.error('Error playing previous track:', error)
    }
  }
}

function handleProgressClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = x / rect.width
  const newTime = percentage * store.duration
  adapter.seek(newTime)
}

function handleVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  const volume = parseFloat(target.value) / 100
  adapter.setVolume(volume)
}

// Watch for current track changes and load it
watch(
  () => store.currentTrack,
  async newTrack => {
    if (newTrack) {
      try {
        await adapter.loadTrack(newTrack)
      } catch (error) {
        console.error('Error loading track:', error)
      }
    }
  }
)
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-2xl z-50">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <!-- Progress Bar -->
      <div
        class="w-full h-1 bg-gray-700 rounded-full cursor-pointer mb-3 overflow-hidden"
        @click="handleProgressClick"
      >
        <div
          class="h-full bg-primary-500 transition-all duration-100"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between">
        <!-- Track Info -->
        <div class="flex-1 min-w-0">
          <div v-if="store.currentTrack" class="flex items-center space-x-3">
            <div
              v-if="store.currentTrack.cover"
              class="w-12 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0"
            >
              <img
                :src="store.currentTrack.cover"
                :alt="store.currentTrack.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-12 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="w-6 h-6 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-white truncate">
                {{ store.currentTrack.title }}
              </p>
              <p class="text-xs text-gray-400 truncate">{{ store.currentTrack.artist }}</p>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">{{ t('player.noTrack') }}</div>
        </div>

        <!-- Controls -->
        <div class="flex items-center space-x-6 px-8">
          <button
            @click="playPrevious"
            :disabled="!store.hasPreviousTrack"
            class="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :title="t('player.previous')"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>

          <button
            @click="togglePlayPause"
            :disabled="!store.currentTrack || store.isLoading"
            class="w-12 h-12 flex items-center justify-center bg-primary-600 hover:bg-primary-700 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            :title="store.isPlaying ? t('player.pause') : t('player.play')"
          >
            <svg v-if="store.isLoading" class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else-if="store.isPlaying" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          </button>

          <button
            @click="playNext"
            :disabled="!store.hasNextTrack"
            class="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :title="t('player.next')"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
            </svg>
          </button>
        </div>

        <!-- Volume & Time -->
        <div class="flex-1 flex items-center justify-end space-x-4">
          <span class="text-xs text-gray-400 tabular-nums">
            {{ formatTime(store.currentTime) }} / {{ formatTime(store.duration) }}
          </span>

          <!-- Loop Button -->
          <button
            @click="store.toggleLoopMode()"
            :class="[
              'transition-colors',
              store.loopMode
                ? 'text-primary-500 hover:text-primary-400'
                : 'text-gray-400 hover:text-white'
            ]"
            :title="store.loopMode ? t('player.loopOn') : t('player.loopOff')"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              :value="volumePercentage"
              @input="handleVolumeChange"
              class="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #0ea5e9;
  cursor: pointer;
  border-radius: 50%;
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #0ea5e9;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}

.slider::-webkit-slider-thumb:hover {
  background: #0284c7;
}

.slider::-moz-range-thumb:hover {
  background: #0284c7;
}
</style>
