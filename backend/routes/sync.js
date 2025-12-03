import express from 'express'
import { getSyncHistory, scanDropboxFolder, importTracks } from '../services/dropboxSync.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()


// Obtener historial de sincronizaciones
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const history = getSyncHistory(limit)

    res.json(history)
  } catch (error) {
    console.error('Error fetching sync history:', error)
    res.status(500).json({ error: 'Failed to fetch sync history' })
  }
})

// Escanear carpeta de Dropbox
router.post('/scan', async (req, res) => {
  try {
    const { folderUrl } = req.body
    if (!folderUrl) {
      return res.status(400).json({ error: 'Missing folderUrl' })
    }

    const files = await scanDropboxFolder(folderUrl)
    res.json({ success: true, files })
  } catch (error) {
    console.error('Scan error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Importar tracks seleccionados
router.post('/import', async (req, res) => {
  try {
    const { tracks } = req.body
    const storagePath = process.env.MUSIC_STORAGE_PATH || './music'

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Missing tracks array' })
    }

    const result = await importTracks(tracks, storagePath)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
