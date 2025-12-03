import type { Track } from '@/types'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')

interface SyncHistoryItem {
  id: number
  source: string
  tracks_added: number
  tracks_removed: number
  status: string
  error_message: string | null
  synced_at: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  async getTracks(): Promise<Track[]> {
    return this.request<Track[]>('/tracks')
  }

  async getTrack(id: string): Promise<Track> {
    return this.request<Track>(`/tracks/${id}`)
  }

  async createTrack(track: Omit<Track, 'id'> & { id: string }): Promise<Track> {
    return this.request<Track>('/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
    })
  }

  async updateTrack(id: string, track: Partial<Track>): Promise<Track> {
    return this.request<Track>(`/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(track),
    })
  }

  async deleteTrack(id: string): Promise<void> {
    await this.request<{ message: string }>(`/tracks/${id}`, {
      method: 'DELETE',
    })
  }

  async getSyncHistory(limit: number = 10): Promise<SyncHistoryItem[]> {
    return this.request<SyncHistoryItem[]>(`/sync/history?limit=${limit}`)
  }

  async downloadDropboxFile(url: string, title?: string, artist?: string): Promise<Track> {
    const response = await this.request<{ success: boolean; track: Track }>(
      '/download/dropbox-file',
      {
        method: 'POST',
        body: JSON.stringify({ url, title, artist }),
      }
    )
    return response.track
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const url = this.baseUrl.replace('/api', '/health')
    const response = await fetch(url)
    return response.json()
  }

  getTrackUrl(filename: string): string {
    return this.baseUrl.replace('/api', `/music/${filename}`)
  }

  async scanDropboxFolder(folderUrl: string): Promise<{ filename: string; url: string }[]> {
    const response = await this.request<{
      success: boolean
      files: { filename: string; url: string }[]
    }>('/sync/scan', {
      method: 'POST',
      body: JSON.stringify({ folderUrl }),
    })
    return response.files
  }

  async importTracks(
    tracks: { filename: string; url: string }[]
  ): Promise<{ added: any[]; failed: any[] }> {
    const response = await this.request<{ success: boolean; added: any[]; failed: any[] }>(
      '/sync/import',
      {
        method: 'POST',
        body: JSON.stringify({ tracks }),
      }
    )
    return { added: response.added, failed: response.failed }
  }

  // Trash Management
  async getTrash(): Promise<Track[]> {
    return this.request<Track[]>('/tracks/trash/all')
  }

  async restoreTrack(id: string): Promise<void> {
    await this.request<{ message: string }>(`/tracks/trash/${id}/restore`, {
      method: 'POST',
    })
  }

  async deleteTrackPermanently(id: string): Promise<void> {
    await this.request<{ message: string }>(`/tracks/trash/${id}`, {
      method: 'DELETE',
    })
  }

  async emptyTrash(olderThan30Days: boolean = false): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>('/tracks/trash/cleanup/all', {
      method: 'DELETE',
      body: JSON.stringify({ olderThan30Days }),
    })
  }

  async clearAllTracks(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/tracks/all/soft', {
      method: 'DELETE',
    })
  }

  async scanLocalFolder(): Promise<{ success: boolean; added: number; message: string }> {
    return this.request<{ success: boolean; added: number; message: string }>(
      '/tracks/scan-local',
      {
        method: 'POST',
      }
    )
  }
}

export const api = new ApiService()
export default api
