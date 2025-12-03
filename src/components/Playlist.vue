<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/player'
import { getPlayerAdapter } from '@/services/playerService'
import TrackItem from './TrackItem.vue'
import EditTrackModal from './EditTrackModal.vue'
import type { Track, TrackType } from '@/types'

const store = usePlayerStore()
const { adapter } = getPlayerAdapter()
const { t } = useI18n()

// Form state
const showAddTrackModal = ref(false)
const showTrashModal = ref(false)
const activeTab = ref<'single' | 'batch'>('single')
const batchUrl = ref('')
const scannedTracks = ref<{ filename: string; url: string; selected: boolean }[]>([])
const isScanning = ref(false)
const isImporting = ref(false)
const showDetails = ref(false)
const showDeleteConfirmModal = ref(false)
const trackToDeleteId = ref<string | null>(null)
const showEditModal = ref(false)
const trackToEdit = ref<Track | null>(null)

const newTrack = ref({
  title: '',
  artist: '',
  type: 'mp3' as TrackType,
  src: '',
  cover: '',
})

// Watch for URL changes to auto-fill title
watch(
  () => newTrack.value.src,
  url => {
    if (!url) return

    try {
      const urlObj = new URL(url)
      let filename = ''

      // Extract filename from path
      const pathParts = urlObj.pathname.split('/')
      filename = pathParts[pathParts.length - 1]

      if (filename) {
        // Decode URI components (e.g. %20 -> space)
        filename = decodeURIComponent(filename)
        // Remove extension
        filename = filename.replace(/\.[^/.]+$/, '')

        // Only auto-fill if not manually editing or if title is empty
        if (!showDetails.value || !newTrack.value.title) {
          newTrack.value.title = filename
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
)

// Computed
const hasPlaylist = computed(() => store.playlist.length > 0)
const selectedTracksCount = computed(() => scannedTracks.value.filter(t => t.selected).length)
const allSelected = computed(
  () => scannedTracks.value.length > 0 && scannedTracks.value.every(t => t.selected)
)

// Methods
async function handlePlayTrack(track: Track, index: number) {
  try {
    store.setCurrentTrack(track, index)
    await adapter.loadTrack(track)
    await adapter.play()
  } catch (error) {
    console.error('Error playing track:', error)
    alert(
      t('alerts.errorPlaying', { error: error instanceof Error ? error.message : 'Unknown error' })
    )
  }
}

function handleRemoveTrack(trackId: string) {
  trackToDeleteId.value = trackId
  showDeleteConfirmModal.value = true
}

async function confirmDeleteTrack() {
  if (trackToDeleteId.value) {
    try {
      await store.removeTrack(trackToDeleteId.value)
    } catch (error) {
      console.error('Error removing track:', error)
      alert(t('alerts.failedRemove'))
    } finally {
      showDeleteConfirmModal.value = false
      trackToDeleteId.value = null
    }
  }
}

function handleEditTrack(track: Track) {
  trackToEdit.value = track
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  trackToEdit.value = null
}

async function handleSaveTrack(updatedTrack: Track) {
  try {
    await store.updateTrack(updatedTrack)
    closeEditModal()
  } catch (error) {
    console.error('Error updating track:', error)
    alert(t('alerts.errorUpdating'))
  }
}

async function scanFolder() {
  if (!batchUrl.value) return

  // Validaciones
  if (batchUrl.value.includes('drive.google.com')) {
    alert(t('alerts.driveNotSupported'))
    return
  }

  if (!batchUrl.value.includes('dropbox.com')) {
    alert(t('alerts.invalidDropbox'))
    return
  }

  try {
    isScanning.value = true
    scannedTracks.value = []

    // Verificar si la función existe antes de llamarla
    if (typeof store.scanDropboxFolder !== 'function') {
      throw new Error('La función de escaneo no está inicializada. Por favor recarga la página.')
    }

    const files = await store.scanDropboxFolder(batchUrl.value)

    scannedTracks.value = files.map(f => ({
      ...f,
      selected: true,
    }))
  } catch (error) {
    console.error('Error scanning folder:', error)
    alert(t('alerts.scanError'))
  } finally {
    isScanning.value = false
  }
}

async function handleOpenTrash() {
  await store.loadTrash()
  showTrashModal.value = true
}

async function handleRestoreTrack(trackId: string) {
  try {
    await store.restoreTrack(trackId)
  } catch (error) {
    alert(t('alerts.failedRestore'))
  }
}

async function handleDeletePermanently(trackId: string) {
  if (confirm(t('alerts.confirmPermanentDelete'))) {
    try {
      await store.deleteTrackPermanently(trackId)
    } catch (error) {
      alert(t('alerts.failedDelete'))
    }
  }
}

async function handleEmptyTrash(olderThan30Days: boolean = false) {
  const message = olderThan30Days ? t('alerts.confirmDeleteOld') : t('alerts.confirmEmptyTrash')

  if (confirm(message)) {
    try {
      await store.emptyTrash(olderThan30Days)
    } catch (error) {
      alert(t('alerts.failedEmptyTrash'))
    }
  }
}

async function handleScanLocal() {
  try {
    const result = await store.scanLocalFolder()
    alert(t('alerts.scanLocalSuccess', { message: result.message }))
  } catch (error) {
    alert(t('alerts.failedScanLocal'))
  }
}

async function addTrack() {
  if (!newTrack.value.title || !newTrack.value.src) {
    alert(t('alerts.fillRequired'))
    return
  }

  try {
    if (newTrack.value.type === 'dropbox') {
      await store.downloadDropboxFile(
        newTrack.value.src,
        newTrack.value.title,
        newTrack.value.artist || 'Unknown Artist'
      )
    } else {
      const track: Track = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newTrack.value.title,
        artist: newTrack.value.artist || 'Unknown Artist',
        type: newTrack.value.type,
        src: newTrack.value.src,
        cover: newTrack.value.cover || undefined,
      }

      await store.addTrack(track)
    }

    // Reset form
    newTrack.value = {
      title: '',
      artist: '',
      type: 'mp3',
      src: '',
      cover: '',
    }

    showAddTrackModal.value = false
  } catch (error) {
    console.error('Error adding track:', error)
    alert(
      t('alerts.errorAdding', { error: error instanceof Error ? error.message : 'Unknown error' })
    )
  }
}

function clearPlaylist() {
  if (confirm(t('alerts.confirmClearPlaylist'))) {
    store.clearPlaylist()
  }
}

function loadSamplePlaylist() {
  const samples: Track[] = [
    {
      id: 'sample-1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      type: 'youtube',
      src: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    },
    {
      id: 'sample-2',
      title: 'Imagine',
      artist: 'John Lennon',
      type: 'youtube',
      src: 'https://www.youtube.com/watch?v=YkgkThdzX-8',
      cover: 'https://i.ytimg.com/vi/YkgkThdzX-8/hqdefault.jpg',
    },
    {
      id: 'sample-3',
      title: 'Hotel California',
      artist: 'Eagles',
      type: 'youtube',
      src: 'https://www.youtube.com/watch?v=09839DpTctU',
      cover: 'https://i.ytimg.com/vi/09839DpTctU/hqdefault.jpg',
    },
  ]

  store.setPlaylist(samples)
}

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  scannedTracks.value.forEach(t => (t.selected = checked))
}

async function importSelectedTracks() {
  const tracksToImport = scannedTracks.value.filter(t => t.selected)
  if (tracksToImport.length === 0) return

  try {
    isImporting.value = true
    const result = await store.importTracks(tracksToImport)

    alert(t('alerts.importSuccess', { added: result.added.length, failed: result.failed.length }))

    if (result.added.length > 0) {
      showAddTrackModal.value = false
      batchUrl.value = ''
      scannedTracks.value = []
    }
  } catch (error) {
    console.error('Error importing tracks:', error)
    alert(t('alerts.importError'))
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">Playlist</h2>
        <div class="flex space-x-2">
          <button
            v-if="!hasPlaylist"
            @click="loadSamplePlaylist"
            class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            {{ t('playlist.loadSample') }}
          </button>
          <button
            @click="handleOpenTrash"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            title="Trash"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>{{ t('header.trash') }}</span>
          </button>
          <button
            @click="showAddTrackModal = true"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ t('header.addTrack') }}</span>
          </button>
          <button
            v-if="hasPlaylist"
            @click="clearPlaylist"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            :title="t('header.clearPlaylist')"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <button
            v-if="hasPlaylist"
            @click="handleOpenTrash"
            class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            :title="t('header.trash')"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-.894.553L4.382 4H2a1 1 0 000 2h1.382l.724 1.447A1 1 0 004 10h8a1 1 0 00.894-.553L13.618 8H16a1 1 0 000-2h-1.382l-.724-1.447A1 1 0 0010 2H6z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <p class="text-sm text-gray-400">
        {{ t('header.tracks', { count: store.playlist.length }, store.playlist.length) }}
      </p>
    </div>

    <!-- Playlist Items -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-if="!hasPlaylist" class="flex flex-col items-center justify-center h-full text-center">
        <svg
          class="w-24 h-24 text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
        <p class="text-gray-400 text-lg mb-2">{{ t('playlist.emptyTitle') }}</p>
        <p class="text-gray-500 text-sm mb-4">{{ t('playlist.emptySubtitle') }}</p>
      </div>

      <TrackItem
        v-for="(track, index) in store.playlist"
        :key="track.id"
        :track="track"
        :index="index"
        @play="handlePlayTrack"
        @remove="handleRemoveTrack"
        @edit="handleEditTrack"
      />
    </div>

    <!-- Add Track Modal -->
    <div
      v-if="showAddTrackModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAddTrackModal = false"
    >
      <div
        class="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-700 max-h-[90vh] flex flex-col"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">{{ t('modal.addTrack.title') }}</h3>
          <button
            @click="showAddTrackModal = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-700 mb-4">
          <button
            @click="activeTab = 'single'"
            class="flex-1 py-2 text-sm font-medium transition-colors relative"
            :class="
              activeTab === 'single' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-300'
            "
          >
            {{ t('modal.addTrack.tabs.single') }}
            <div
              v-if="activeTab === 'single'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"
            ></div>
          </button>
          <button
            @click="activeTab = 'batch'"
            class="flex-1 py-2 text-sm font-medium transition-colors relative"
            :class="
              activeTab === 'batch' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-300'
            "
          >
            {{ t('modal.addTrack.tabs.batch') }}
            <div
              v-if="activeTab === 'batch'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"
            ></div>
          </button>
        </div>

        <!-- Single Track Form -->
        <form
          v-if="activeTab === 'single'"
          @submit.prevent="addTrack"
          class="space-y-4 overflow-y-auto"
        >
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{
              t('modal.addTrack.type')
            }}</label>
            <select
              v-model="newTrack.type"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="mp3">MP3 (Direct URL)</option>
              <option value="dropbox">Dropbox ✅ (Recomendado)</option>
              <option value="drive">Google Drive ⚠️ (Limitado)</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{
              t('modal.addTrack.sourceUrl')
            }}</label>
            <input
              v-model="newTrack.src"
              type="url"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              :placeholder="
                newTrack.type === 'mp3'
                  ? 'https://example.com/song.mp3'
                  : newTrack.type === 'dropbox'
                    ? 'https://www.dropbox.com/s/abc123/song.mp3?dl=0'
                    : newTrack.type === 'drive'
                      ? 'https://drive.google.com/file/d/FILE_ID/view'
                      : 'https://www.youtube.com/watch?v=...'
              "
              required
            />
            <p v-if="newTrack.type === 'dropbox'" class="text-xs text-green-400 mt-1">
              {{ t('modal.addTrack.dropbox.hint') }}
            </p>
            <p v-if="newTrack.type === 'drive'" class="text-xs text-yellow-400 mt-1">
              {{ t('modal.addTrack.drive.warning') }}
            </p>
          </div>

          <!-- Auto-detected title preview -->
          <div
            v-if="!showDetails && newTrack.title"
            class="bg-gray-700/50 p-3 rounded-lg border border-gray-600 flex justify-between items-center"
          >
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                {{ t('modal.addTrack.detectedTitle') }}
              </p>
              <p class="text-white font-medium truncate max-w-[250px]">{{ newTrack.title }}</p>
            </div>
            <button
              type="button"
              @click="showDetails = true"
              class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
            >
              {{ t('modal.addTrack.edit') }}
            </button>
          </div>

          <!-- Checkbox to show details -->
          <div class="flex items-center">
            <input
              id="showDetails"
              type="checkbox"
              v-model="showDetails"
              class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-offset-gray-800"
            />
            <label for="showDetails" class="ml-2 text-sm text-gray-300 cursor-pointer select-none">
              {{ t('modal.addTrack.manualEdit') }}
            </label>
          </div>

          <div v-if="showDetails" class="space-y-4 border-t border-gray-700 pt-4 animate-fade-in">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">{{
                t('modal.addTrack.trackTitle')
              }}</label>
              <input
                v-model="newTrack.title"
                type="text"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Track title"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">{{
                t('modal.addTrack.artist')
              }}</label>
              <input
                v-model="newTrack.artist"
                type="text"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Artist name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">{{
                t('modal.addTrack.coverUrl')
              }}</label>
              <input
                v-model="newTrack.cover"
                type="url"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {{ t('modal.addTrack.buttons.add') }}
            </button>
            <button
              type="button"
              @click="showAddTrackModal = false"
              class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {{ t('modal.addTrack.buttons.cancel') }}
            </button>
          </div>
        </form>

        <!-- Batch Import Form -->
        <div v-else class="flex flex-col h-full overflow-hidden">
          <div class="space-y-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">{{
                t('modal.addTrack.batch.folderUrl')
              }}</label>
              <div class="flex space-x-2">
                <input
                  v-model="batchUrl"
                  type="url"
                  class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://www.dropbox.com/sh/..."
                  @keyup.enter="scanFolder"
                />
                <button
                  @click="scanFolder"
                  :disabled="isScanning || !batchUrl"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{
                    isScanning ? t('modal.addTrack.batch.scanning') : t('modal.addTrack.batch.scan')
                  }}
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1">
                {{ t('modal.addTrack.dropbox.folderHint') }}
              </p>
            </div>
          </div>

          <!-- Scanned Results -->
          <div v-if="scannedTracks.length > 0" class="flex-1 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-offset-gray-800"
                />
                <span class="ml-2 text-sm text-gray-300">{{
                  t('modal.addTrack.batch.selectAll', { count: selectedTracksCount })
                }}</span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto border border-gray-700 rounded-lg bg-gray-900/50">
              <div
                v-for="(track, idx) in scannedTracks"
                :key="idx"
                class="flex items-center p-3 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0 transition-colors cursor-pointer"
                @click="track.selected = !track.selected"
              >
                <input
                  type="checkbox"
                  v-model="track.selected"
                  class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-offset-gray-800"
                  @click.stop
                />
                <div class="ml-3 overflow-hidden">
                  <p class="text-sm text-white truncate">{{ track.filename }}</p>
                </div>
              </div>
            </div>

            <div class="flex space-x-3 pt-4">
              <button
                @click="importSelectedTracks"
                :disabled="isImporting || selectedTracksCount === 0"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg
                  v-if="isImporting"
                  class="w-5 h-5 animate-spin mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{
                  isImporting
                    ? t('modal.addTrack.batch.importing')
                    : t('modal.addTrack.batch.import', { count: selectedTracksCount })
                }}
              </button>
            </div>
          </div>

          <div
            v-else-if="!isScanning && batchUrl && scannedTracks.length === 0"
            class="flex-1 flex items-center justify-center text-gray-500"
          >
            <p>{{ t('modal.addTrack.batch.noTracks') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Trash Modal -->
    <div
      v-if="showTrashModal"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="showTrashModal = false"
    >
      <div class="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">{{ t('modal.trash.title') }}</h3>
          <button
            @click="showTrashModal = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <!-- Trash Items -->
        <div class="flex-1 overflow-y-auto space-y-2">
          <div
            v-for="track in store.trash"
            :key="track.id"
            class="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div class="flex-1 truncate">
              <p class="text-sm text-white font-medium truncate">{{ track.title }}</p>
              <p class="text-xs text-gray-400 truncate">{{ track.artist }}</p>
            </div>
            <div class="flex space-x-2 ml-2">
              <button
                @click="handleRestoreTrack(track.id)"
                class="text-green-400 hover:text-green-300 p-1"
                title="Restore"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                @click="handleDeletePermanently(track.id)"
                class="text-red-400 hover:text-red-300 p-1"
                title="Delete Permanently"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="store.trash.length === 0" class="text-center text-gray-400 py-8">
            {{ t('modal.trash.empty') }}
          </div>
        </div>

        <!-- Trash Actions -->
        <div class="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
          <button
            @click="handleScanLocal"
            class="text-xs text-blue-400 hover:text-blue-300 underline"
            :title="t('modal.trash.recoverOrphaned')"
          >
            {{ t('modal.trash.recoverOrphaned') }}
          </button>

          <div class="flex space-x-3">
            <button
              @click="handleEmptyTrash(true)"
              class="text-xs text-gray-400 hover:text-white underline"
            >
              {{ t('modal.trash.cleanOld') }}
            </button>
            <button
              v-if="store.trash.length > 0"
              @click="handleEmptyTrash(false)"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
            >
              {{ t('modal.trash.emptyTrash') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmModal"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteConfirmModal = false"
    >
      <div
        class="bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full p-6 border border-gray-700 text-center"
      >
        <div class="mb-4 text-yellow-500 flex justify-center">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">{{ t('modal.deleteConfirm.title') }}</h3>
        <p class="text-gray-400 mb-6">
          {{ t('modal.deleteConfirm.message') }}
        </p>
        <div class="flex space-x-3">
          <button
            @click="showDeleteConfirmModal = false"
            class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {{ t('modal.deleteConfirm.cancel') }}
          </button>
          <button
            @click="confirmDeleteTrack"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {{ t('modal.deleteConfirm.delete') }}
          </button>
        </div>
      </div>
    </div>
    <!-- Edit Track Modal -->
    <EditTrackModal
      v-if="trackToEdit"
      :track="trackToEdit"
      :isOpen="showEditModal"
      @close="closeEditModal"
      @save="handleSaveTrack"
    />
  </div>
</template>
