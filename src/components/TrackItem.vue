<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Track } from '@/types'
import { usePlayerStore } from '@/stores/player'

interface Props {
  track: Track
  index: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  play: [track: Track, index: number]
  remove: [trackId: string]
}>()

const store = usePlayerStore()
const { t } = useI18n()

const isCurrentTrack = computed(() => store.currentTrack?.id === props.track.id)
const isPlaying = computed(() => isCurrentTrack.value && store.isPlaying)

function handlePlay() {
  emit('play', props.track, props.index)
}

function handleRemove() {
  emit('remove', props.track.id)
}

function getTrackIcon() {
  if (props.track.type === 'youtube') return 'youtube'
  if (props.track.type === 'drive') return 'drive'
  if (props.track.type === 'dropbox') return 'dropbox'
  return 'music'
}
</script>

<template>
  <div
    class="group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer"
    :class="[
      isCurrentTrack
        ? 'bg-primary-900/30 border border-primary-500/50'
        : 'hover:bg-gray-700/50 border border-transparent',
    ]"
    @click="handlePlay"
  >
    <!-- Cover or Icon -->
    <div class="relative flex-shrink-0">
      <div
        v-if="track.cover"
        class="w-12 h-12 rounded overflow-hidden"
        :class="{ 'ring-2 ring-primary-500': isCurrentTrack }"
      >
        <img :src="track.cover" :alt="track.title" class="w-full h-full object-cover" />
      </div>
      <div
        v-else
        class="w-12 h-12 rounded flex items-center justify-center"
        :class="[
          isCurrentTrack
            ? 'bg-primary-600'
            : 'bg-gray-700 group-hover:bg-gray-600'
        ]"
      >
        <!-- Music Note Icon -->
        <svg
          v-if="getTrackIcon() === 'music'"
          class="w-6 h-6"
          :class="isCurrentTrack ? 'text-white' : 'text-gray-400'"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
        <!-- Google Drive Icon -->
        <svg
          v-else-if="getTrackIcon() === 'drive'"
          class="w-6 h-6"
          :class="isCurrentTrack ? 'text-white' : 'text-yellow-500'"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7.71 3.5L1.15 15l3.21 5.55L11.92 9.05 7.71 3.5zM12.36 9.43L6.8 20h13.11l-5.56-10.57h-1.99zM14.1 3.5l-3.21 5.55h7.85L22.85 3.5H14.1z"/>
        </svg>
        <!-- Dropbox Icon -->
        <svg
          v-else-if="getTrackIcon() === 'dropbox'"
          class="w-6 h-6"
          :class="isCurrentTrack ? 'text-white' : 'text-blue-400'"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452 0 13.274zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371z"/>
        </svg>
        <!-- YouTube Icon -->
        <svg
          v-else
          class="w-6 h-6"
          :class="isCurrentTrack ? 'text-white' : 'text-red-500'"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>

      <!-- Playing Indicator -->
      <div
        v-if="isPlaying"
        class="absolute inset-0 flex items-center justify-center bg-black/40 rounded"
      >
        <div class="flex space-x-0.5">
          <div class="w-0.5 h-3 bg-primary-500 animate-pulse" style="animation-delay: 0s"></div>
          <div class="w-0.5 h-4 bg-primary-500 animate-pulse" style="animation-delay: 0.15s"></div>
          <div class="w-0.5 h-3 bg-primary-500 animate-pulse" style="animation-delay: 0.3s"></div>
        </div>
      </div>
    </div>

    <!-- Track Info -->
    <div class="flex-1 min-w-0">
      <p
        class="font-medium truncate"
        :class="isCurrentTrack ? 'text-primary-400' : 'text-gray-200 group-hover:text-white'"
      >
        {{ track.title }}
      </p>
      <p class="text-sm text-gray-400 truncate">{{ track.artist }}</p>
    </div>

    <!-- Type Badge -->
    <div class="flex-shrink-0">
      <span
        class="text-xs px-2 py-1 rounded-full font-medium"
        :class="[
          track.type === 'youtube'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : track.type === 'drive'
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : track.type === 'dropbox'
            ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        ]"
      >
        {{
          track.type === 'drive'
            ? 'DRIVE'
            : track.type === 'dropbox'
            ? 'DROPBOX'
            : track.type.toUpperCase()
        }}
      </span>
    </div>

    <!-- Remove Button -->
    <button
      @click.stop="handleRemove"
      class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400"
      :title="t('trackItem.remove')"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>
