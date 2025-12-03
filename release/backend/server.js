import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { initDatabase } from './config/database.js'
import db from './config/database.js'
import { MUSIC_PATH } from './config/paths.js'
import fs from 'fs'
import tracksRouter from './routes/tracks.js'
import playlistsRouter from './routes/playlists.js'
import syncRouter from './routes/sync.js'
import downloadRouter from './routes/download.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const MUSIC_STORAGE_PATH = process.env.MUSIC_STORAGE_PATH || MUSIC_PATH

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins (for local network access)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Initialize database
console.log('Initializing database...')
initDatabase()

// Migration: Move files from legacy ./music to MUSIC_STORAGE_PATH
const legacyMusicPath = path.join(__dirname, 'music')
console.log('--- MIGRATION DEBUG ---')
console.log('__dirname:', __dirname)
console.log('legacyMusicPath:', legacyMusicPath)
console.log('MUSIC_STORAGE_PATH:', path.resolve(MUSIC_STORAGE_PATH))
console.log('Exists legacy?', fs.existsSync(legacyMusicPath))
console.log('Are paths different?', legacyMusicPath !== path.resolve(MUSIC_STORAGE_PATH))
console.log('-----------------------')

if (fs.existsSync(legacyMusicPath) && legacyMusicPath !== path.resolve(MUSIC_STORAGE_PATH)) {
  console.log('Checking for legacy music files...')
  try {
    const files = fs.readdirSync(legacyMusicPath)
    let movedCount = 0

    files.forEach(file => {
      const srcPath = path.join(legacyMusicPath, file)
      const destPath = path.join(MUSIC_STORAGE_PATH, file)

      // Only move files, and only if they don't exist in destination
      if (fs.lstatSync(srcPath).isFile() && !fs.existsSync(destPath)) {
        try {
          fs.renameSync(srcPath, destPath)
          console.log(`Migrated: ${file}`)
          movedCount++
        } catch (err) {
          // Fallback to copy+unlink if rename fails (e.g. across drives)
          try {
            fs.copyFileSync(srcPath, destPath)
            console.log(`Migrated (copy): ${file}`)
            movedCount++

            // Try to delete original, but ignore error if permission denied
            try {
              fs.unlinkSync(srcPath)
            } catch (unlinkErr) {
              console.warn(
                `Could not delete legacy file ${file} (permission denied), but it was copied successfully.`
              )
            }
          } catch (e) {
            console.error(`Failed to migrate ${file}:`, e)
          }
        }
      }
    })

    if (movedCount > 0) {
      console.log(`Migration complete: Moved ${movedCount} files to ${MUSIC_STORAGE_PATH}`)
    }
  } catch (error) {
    console.error('Error during music migration:', error)
  }
}

// Cleanup old trash (older than 30 days)
try {
  console.log('Running trash cleanup...')
  const tracksToDelete = db
    .prepare("SELECT id, file_path FROM tracks WHERE deleted_at < datetime('now', '-30 days')")
    .all()

  for (const track of tracksToDelete) {
    if (track.file_path && fs.existsSync(track.file_path)) {
      try {
        fs.unlinkSync(track.file_path)
      } catch (e) {
        console.error(`Failed to delete file ${track.file_path}`, e)
      }
    }
  }

  if (tracksToDelete.length > 0) {
    const result = db
      .prepare("DELETE FROM tracks WHERE deleted_at < datetime('now', '-30 days')")
      .run()
    console.log(`Cleaned up ${result.changes} old tracks from trash`)
  } else {
    console.log('No old tracks to clean up')
  }
} catch (error) {
  console.error('Error during trash cleanup:', error)
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API Routes
app.use('/api/tracks', tracksRouter)
app.use('/api/playlists', playlistsRouter)
app.use('/api/sync', syncRouter)
app.use('/api/download', downloadRouter)

// Servir archivos MP3 estáticos
app.use('/music', express.static(path.resolve(MUSIC_STORAGE_PATH)))

// Servir frontend estático en producción
// Servir frontend estático si existe la carpeta dist (Producción o Standalone)
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  console.log('Serving static frontend from:', distPath)
  app.use(express.static(distPath))
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log('\n========================================')
  console.log(`   Hybrid Music Player Backend`)
  console.log('   ========================================')
  console.log(`   Server running on port ${PORT}`)
  console.log(`   API: http://localhost:${PORT}/api`)
  console.log(`   Music: http://localhost:${PORT}/music`)
  console.log(`   Storage: ${path.resolve(MUSIC_STORAGE_PATH)}`)
  console.log('   ========================================\n')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...')
  process.exit(0)
})
