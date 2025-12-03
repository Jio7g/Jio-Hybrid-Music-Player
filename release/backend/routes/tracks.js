import express from 'express'
import db from '../config/database.js'
import fs from 'fs'

const router = express.Router()

// Get all tracks (active only)
router.get('/', (req, res) => {
  try {
    const tracks = db.prepare('SELECT * FROM tracks WHERE deleted_at IS NULL ORDER BY created_at DESC').all()
    res.json(tracks)
  } catch (error) {
    console.error('Error fetching tracks:', error)
    res.status(500).json({ error: 'Failed to fetch tracks' })
  }
})

// Get trash tracks
router.get('/trash/all', (req, res) => {
  try {
    const tracks = db.prepare('SELECT * FROM tracks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all()
    res.json(tracks)
  } catch (error) {
    console.error('Error fetching trash:', error)
    res.status(500).json({ error: 'Failed to fetch trash' })
  }
})

// Restore track
router.post('/trash/:id/restore', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE tracks SET deleted_at = NULL WHERE id = ?')
    const result = stmt.run(req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Track not found' })
    }
    
    res.json({ message: 'Track restored successfully' })
  } catch (error) {
    console.error('Error restoring track:', error)
    res.status(500).json({ error: 'Failed to restore track' })
  }
})

// Permanently delete track
router.delete('/trash/:id', (req, res) => {
  try {
    // Get file path first to delete physical file
    const track = db.prepare('SELECT file_path FROM tracks WHERE id = ?').get(req.params.id)
    
    if (track && track.file_path) {
      try {
        if (fs.existsSync(track.file_path)) {
          fs.unlinkSync(track.file_path)
        }
      } catch (e) {
        console.error('Error deleting physical file:', e)
      }
    }

    const stmt = db.prepare('DELETE FROM tracks WHERE id = ?')
    const result = stmt.run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Track not found' })
    }

    res.json({ message: 'Track permanently deleted' })
  } catch (error) {
    console.error('Error deleting track:', error)
    res.status(500).json({ error: 'Failed to delete track' })
  }
})

// Empty trash (older than 30 days or all)
router.delete('/trash/cleanup/all', (req, res) => {
  try {
    const { olderThan30Days } = req.body
    
    let query = 'SELECT id, file_path FROM tracks WHERE deleted_at IS NOT NULL'
    if (olderThan30Days) {
      query += " AND deleted_at < datetime('now', '-30 days')"
    }
    
    const tracksToDelete = db.prepare(query).all()
    
    // Delete physical files
    let deletedCount = 0
    
    for (const track of tracksToDelete) {
      if (track.file_path && fs.existsSync(track.file_path)) {
        try {
          fs.unlinkSync(track.file_path)
        } catch (e) {
          console.error(`Failed to delete file ${track.file_path}`, e)
        }
      }
    }
    
    // Delete from DB
    let deleteQuery = 'DELETE FROM tracks WHERE deleted_at IS NOT NULL'
    if (olderThan30Days) {
      deleteQuery += " AND deleted_at < datetime('now', '-30 days')"
    }
    
    const result = db.prepare(deleteQuery).run()
    
    res.json({ 
      message: 'Cleanup completed', 
      deletedCount: result.changes 
    })
  } catch (error) {
    console.error('Error cleaning trash:', error)
    res.status(500).json({ error: 'Failed to clean trash' })
  }
})

// Soft delete all tracks (Clear Playlist)
router.delete('/all/soft', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE tracks SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL')
    const result = stmt.run()
    res.json({ message: 'All tracks moved to trash', count: result.changes })
  } catch (error) {
    console.error('Error clearing playlist:', error)
    res.status(500).json({ error: 'Failed to clear playlist' })
  }
})

// Get track by ID
router.get('/:id', (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id)
    if (!track) {
      return res.status(404).json({ error: 'Track not found' })
    }
    res.json(track)
  } catch (error) {
    console.error('Error fetching track:', error)
    res.status(500).json({ error: 'Failed to fetch track' })
  }
})

// Add new track
router.post('/', (req, res) => {
  try {
    const { id, title, artist, type, src, cover, duration, file_path, file_size } = req.body

    if (!id || !title || !type || !src) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const stmt = db.prepare(`
      INSERT INTO tracks (id, title, artist, type, src, cover, duration, file_path, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, title, artist || 'Unknown Artist', type, src, cover, duration, file_path, file_size)

    const newTrack = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id)
    res.status(201).json(newTrack)
  } catch (error) {
    console.error('Error creating track:', error)
    res.status(500).json({ error: 'Failed to create track' })
  }
})

// Update track
router.put('/:id', (req, res) => {
  try {
    const { title, artist, type, src, cover, duration, file_path, file_size } = req.body

    const stmt = db.prepare(`
      UPDATE tracks
      SET title = COALESCE(?, title),
          artist = COALESCE(?, artist),
          type = COALESCE(?, type),
          src = COALESCE(?, src),
          cover = COALESCE(?, cover),
          duration = COALESCE(?, duration),
          file_path = COALESCE(?, file_path),
          file_size = COALESCE(?, file_size),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = stmt.run(title, artist, type, src, cover, duration, file_path, file_size, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Track not found' })
    }

    const updatedTrack = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id)
    res.json(updatedTrack)
  } catch (error) {
    console.error('Error updating track:', error)
    res.status(500).json({ error: 'Failed to update track' })
  }
})

// Delete track (Soft delete)
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('UPDATE tracks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
    const result = stmt.run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Track not found' })
    }

    res.json({ message: 'Track moved to trash' })
  } catch (error) {
    console.error('Error deleting track:', error)
    res.status(500).json({ error: 'Failed to delete track' })
  }
})

// Scan local folder for orphaned files
router.post('/scan-local', async (req, res) => {
  try {
    const musicPath = process.env.MUSIC_STORAGE_PATH || './music'
    const fs = await import('fs')
    const path = await import('path')
    const { parseFile } = await import('music-metadata')

    if (!fs.existsSync(musicPath)) {
      return res.json({ added: 0, message: 'Music folder not found' })
    }

    const files = fs.readdirSync(musicPath)
    const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'))
    
    // Get existing file paths from DB (including deleted ones to avoid duplicates if they are just in trash)
    const existingTracks = db.prepare('SELECT file_path FROM tracks').all()
    const existingPaths = new Set(existingTracks.map(t => t.file_path ? path.resolve(t.file_path) : null))

    let addedCount = 0

    for (const file of mp3Files) {
      const fullPath = path.resolve(musicPath, file)
      
      if (!existingPaths.has(fullPath)) {
        // Found orphaned file
        try {
          const metadata = await parseFile(fullPath)
          const trackId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const stats = fs.statSync(fullPath)

          db.prepare(`
            INSERT INTO tracks (id, title, artist, type, src, cover, duration, file_path, file_size)
            VALUES (?, ?, ?, 'local', ?, ?, ?, ?, ?)
          `).run(
            trackId,
            metadata.common.title || path.basename(file, '.mp3'),
            metadata.common.artist || 'Unknown Artist',
            `/music/${file}`,
            null, // Cover extraction is complex, skipping for now
            metadata.format.duration || 0,
            fullPath,
            stats.size
          )
          addedCount++
        } catch (e) {
          console.error(`Error processing orphaned file ${file}:`, e)
        }
      }
    }

    res.json({ 
      success: true, 
      added: addedCount, 
      message: `Scanned local folder. Recovered ${addedCount} orphaned tracks.` 
    })
  } catch (error) {
    console.error('Error scanning local folder:', error)
    res.status(500).json({ error: 'Failed to scan local folder' })
  }
})

export default router
