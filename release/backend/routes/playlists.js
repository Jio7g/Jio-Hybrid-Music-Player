import express from 'express'
import db from '../config/database.js'

const router = express.Router()

// Get all playlists
router.get('/', (req, res) => {
  try {
    const playlists = db.prepare('SELECT * FROM playlists ORDER BY created_at DESC').all()
    res.json(playlists)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    res.status(500).json({ error: 'Failed to fetch playlists' })
  }
})

// Get playlist by ID with tracks
router.get('/:id', (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id)

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' })
    }

    // Get tracks for this playlist
    const tracks = db.prepare(`
      SELECT t.*, pt.position
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC
    `).all(req.params.id)

    res.json({ ...playlist, tracks })
  } catch (error) {
    console.error('Error fetching playlist:', error)
    res.status(500).json({ error: 'Failed to fetch playlist' })
  }
})

// Create playlist
router.post('/', (req, res) => {
  try {
    const { id, name, description } = req.body

    if (!id || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const stmt = db.prepare(`
      INSERT INTO playlists (id, name, description)
      VALUES (?, ?, ?)
    `)

    stmt.run(id, name, description)

    const newPlaylist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id)
    res.status(201).json(newPlaylist)
  } catch (error) {
    console.error('Error creating playlist:', error)
    res.status(500).json({ error: 'Failed to create playlist' })
  }
})

// Update playlist
router.put('/:id', (req, res) => {
  try {
    const { name, description } = req.body

    const stmt = db.prepare(`
      UPDATE playlists
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = stmt.run(name, description, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Playlist not found' })
    }

    const updatedPlaylist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id)
    res.json(updatedPlaylist)
  } catch (error) {
    console.error('Error updating playlist:', error)
    res.status(500).json({ error: 'Failed to update playlist' })
  }
})

// Delete playlist
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM playlists WHERE id = ?')
    const result = stmt.run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Playlist not found' })
    }

    res.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    res.status(500).json({ error: 'Failed to delete playlist' })
  }
})

// Add track to playlist
router.post('/:id/tracks', (req, res) => {
  try {
    const { track_id, position } = req.body

    if (!track_id) {
      return res.status(400).json({ error: 'Missing track_id' })
    }

    // Get max position if position not provided
    let trackPosition = position
    if (trackPosition === undefined) {
      const maxPos = db.prepare(
        'SELECT MAX(position) as max_pos FROM playlist_tracks WHERE playlist_id = ?'
      ).get(req.params.id)
      trackPosition = (maxPos.max_pos || 0) + 1
    }

    const stmt = db.prepare(`
      INSERT INTO playlist_tracks (playlist_id, track_id, position)
      VALUES (?, ?, ?)
    `)

    stmt.run(req.params.id, track_id, trackPosition)

    res.status(201).json({ message: 'Track added to playlist' })
  } catch (error) {
    console.error('Error adding track to playlist:', error)
    res.status(500).json({ error: 'Failed to add track to playlist' })
  }
})

// Remove track from playlist
router.delete('/:id/tracks/:track_id', (req, res) => {
  try {
    const stmt = db.prepare(`
      DELETE FROM playlist_tracks
      WHERE playlist_id = ? AND track_id = ?
    `)

    const result = stmt.run(req.params.id, req.params.track_id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Track not found in playlist' })
    }

    res.json({ message: 'Track removed from playlist' })
  } catch (error) {
    console.error('Error removing track from playlist:', error)
    res.status(500).json({ error: 'Failed to remove track from playlist' })
  }
})

export default router
