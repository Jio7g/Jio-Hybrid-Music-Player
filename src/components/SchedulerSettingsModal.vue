<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = usePlayerStore()

// Local state for form
const weekdaysStart = ref(store.scheduleConfig.weekdays.start)
const weekdaysEnd = ref(store.scheduleConfig.weekdays.end)
const weekendsStart = ref(store.scheduleConfig.weekends.start)
const weekendsEnd = ref(store.scheduleConfig.weekends.end)

function save() {
  store.updateScheduleConfig({
    weekdays: {
      start: weekdaysStart.value,
      end: weekdaysEnd.value,
    },
    weekends: {
      start: weekendsStart.value,
      end: weekendsEnd.value,
    },
  })
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <svg
            class="w-6 h-6 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Schedule Settings
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Weekdays -->
        <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Weekdays (Mon - Fri)
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Start Time</label>
              <input
                v-model="weekdaysStart"
                type="time"
                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">End Time</label>
              <input
                v-model="weekdaysEnd"
                type="time"
                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Weekends -->
        <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Weekends (Sat - Sun)
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Start Time</label>
              <input
                v-model="weekendsStart"
                type="time"
                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">End Time</label>
              <input
                v-model="weekendsEnd"
                type="time"
                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          @click="save"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-primary-500/20"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>
