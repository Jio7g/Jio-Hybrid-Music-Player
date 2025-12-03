import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'db.sqlite')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize database schema
export function initDatabase() {
  // Tracks table - almacena metadata de las canciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('mp3', 'youtube', 'drive', 'dropbox', 'local')),
      src TEXT NOT NULL,
      cover TEXT,
      duration REAL,
      file_path TEXT,
      file_size INTEGER,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Migration: Add deleted_at column if it doesn't exist
  try {
    const tableInfo = db.pragma('table_info(tracks)')
    const hasDeletedAt = tableInfo.some(col => col.name === 'deleted_at')
    if (!hasDeletedAt) {
      console.log('Migrating database: Adding deleted_at column to tracks table...')
      db.exec('ALTER TABLE tracks ADD COLUMN deleted_at DATETIME')
    }
  } catch (error) {
    console.error('Error checking/adding deleted_at column:', error)
  }

  // Playlists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Playlist tracks (many-to-many relationship)
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    )
  `)

  // Settings table - para guardar configuraciones como loop mode
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sync history - historial de sincronizaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      tracks_added INTEGER DEFAULT 0,
      tracks_removed INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('success', 'error')),
      error_message TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Database initialized successfully')
}

// Helper functions for transactions
export function transaction(fn) {
  return db.transaction(fn)
}

export default db
