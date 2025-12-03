<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Track } from '@/types'

const props = defineProps<{
  track: Track
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', track: Track): void
}>()

const { t } = useI18n()

const editedTrack = ref<Track>({ ...props.track })
const isSaving = ref(false)

watch(
  () => props.track,
  newTrack => {
    editedTrack.value = { ...newTrack }
  }
)

async function handleSave() {
  if (!editedTrack.value.title) return

  isSaving.value = true
  try {
    emit('save', editedTrack.value)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-white">{{ t('modal.editTrack.title') }}</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">{{
            t('modal.editTrack.trackTitle')
          }}</label>
          <input
            v-model="editedTrack.title"
            type="text"
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">{{
            t('modal.editTrack.artist')
          }}</label>
          <input
            v-model="editedTrack.artist"
            type="text"
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex space-x-3 pt-4">
          <button
            type="submit"
            :disabled="isSaving"
            class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ isSaving ? t('common.saving') : t('common.save') }}
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
