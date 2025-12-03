import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isWindows = process.platform === 'win32'
const isProduction = process.env.NODE_ENV === 'production'
const isInProgramFiles = __dirname.includes('Program Files')

let dataDir

if (isWindows && (isProduction || isInProgramFiles)) {
  // In production on Windows OR if running from Program Files
  // use ProgramData (e.g., C:\ProgramData\HybridMusicPlayer)
  const programData = process.env.ProgramData || 'C:\\ProgramData'
  dataDir = path.join(programData, 'HybridMusicPlayer')
} else {
  // In development or other OS, use project root
  dataDir = path.resolve(__dirname, '..', '..')
}

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true })
  } catch (error) {
    console.error(`Failed to create data directory at ${dataDir}:`, error)
    // Fallback to local directory if permission fails
    dataDir = path.resolve(__dirname, '..', '..')
  }
}

export const DATA_DIR = dataDir
export const DB_PATH = path.join(dataDir, 'db.sqlite')
export const MUSIC_PATH = path.join(dataDir, 'music')

// Ensure music directory exists
if (!fs.existsSync(MUSIC_PATH)) {
  try {
    fs.mkdirSync(MUSIC_PATH, { recursive: true })
  } catch (error) {
    console.error(`Failed to create music directory at ${MUSIC_PATH}:`, error)
  }
}

console.log('Configuration loaded:')
console.log(`- Data Dir: ${DATA_DIR}`)
console.log(`- Database: ${DB_PATH}`)
console.log(`- Music:    ${MUSIC_PATH}`)
