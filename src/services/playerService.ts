import { usePlayerAdapter } from '@/composables/usePlayerAdapter'

// Singleton instance of the player adapter
let adapterInstance: ReturnType<typeof usePlayerAdapter> | null = null

export function getPlayerAdapter() {
  if (!adapterInstance) {
    adapterInstance = usePlayerAdapter()
  }
  return adapterInstance
}
