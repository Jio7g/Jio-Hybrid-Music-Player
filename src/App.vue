<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/player'
import Playlist from './components/Playlist.vue'
import PlayerControls from './components/PlayerControls.vue'

const store = usePlayerStore()
const { t, locale } = useI18n()

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'es' : 'en'
}

onMounted(() => {
  document.documentElement.classList.add('dark')
  store.loadTracksFromBackend()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
          <div class="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">{{ t('app.title') }}</h1>
            <p class="text-sm text-gray-400">{{ t('app.subtitle') }}</p>
          </div>
        </div>
        <button
          @click="toggleLanguage"
          class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600"
        >
          {{ locale === 'en' ? 'ES' : 'EN' }}
        </button>
      </div>
    </div>
  </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div class="max-w-7xl mx-auto h-full">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 h-full">
          <!-- Playlist Section -->
          <div class="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col">
            <Playlist />
          </div>

          <!-- Info Panel -->
          <div class="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 flex flex-col">
            <h3 class="text-lg font-bold mb-4 text-white">{{ t('howToUse.title') }}</h3>
            <div class="space-y-4 text-sm text-gray-300">
              <div class="flex items-start space-x-3">
                <div class="bg-primary-600 rounded-full p-2 flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-white">{{ t('howToUse.addTracks.title') }}</p>
                  <p class="text-gray-400">{{ t('howToUse.addTracks.desc') }}</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <div class="bg-primary-600 rounded-full p-2 flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-white">{{ t('howToUse.playMusic.title') }}</p>
                  <p class="text-gray-400">{{ t('howToUse.playMusic.desc') }}</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <div class="bg-primary-600 rounded-full p-2 flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-white">{{ t('howToUse.hybridSupport.title') }}</p>
                  <p class="text-gray-400">{{ t('howToUse.hybridSupport.desc') }}</p>
                </div>
              </div>
            </div>

            <div class="mt-auto pt-6 border-t border-gray-700">
              <h4 class="text-sm font-semibold mb-2 text-white">{{ t('howToUse.supportedFormats') }}</h4>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                  MP3
                </span>
                <span class="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                  Google Drive
                </span>
                <span class="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30">
                  YouTube
                </span>
              </div>
            </div>

            <div class="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <p class="text-xs text-gray-500 text-center">
                {{ t('app.builtWith') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Player Controls (Fixed Bottom) -->
    <PlayerControls />

    <!-- Spacer for fixed player controls -->
    <div class="h-24"></div>
  </div>
</template>
