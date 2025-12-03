import express from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseFile } from 'music-metadata'
import db from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

function convertDropboxUrl(url) {
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set('dl', '1')
    return urlObj.toString()
  } catch (error) {
    let directUrl = url.replace(/\?dl=0/, '?dl=1')
    directUrl = directUrl.replace(/&dl=0/, '&dl=1')

    if (!directUrl.includes('dl=')) {
      directUrl += url.includes('?') ? '&dl=1' : '?dl=1'
    }

    return directUrl
  }
}

function extractFilename(url) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    return decodeURIComponent(filename)
  } catch {
    return `track_${Date.now()}.mp3`
  }
}

async function extractMetadata(filePath) {
  try {
    const metadata = await parseFile(filePath)
    return {
      title: metadata.common.title || path.basename(filePath, '.mp3'),
      artist: metadata.common.artist || 'Unknown Artist',
      duration: metadata.format.duration || 0
    }
  } catch (error) {
    console.warn('Could not extract metadata:', error.message)
    return {
      title: path.basename(filePath, '.mp3'),
      artist: 'Unknown Artist',
      duration: 0
    }
  }
}

router.post('/dropbox-file', async (req, res) => {
  try {
    const { url, title, artist } = req.body
    const storagePath = process.env.MUSIC_STORAGE_PATH || './music'

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' })
    }

    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true })
    }

    const directUrl = convertDropboxUrl(url)
    const filename = extractFilename(url)
    const destPath = path.join(storagePath, filename)

    console.log(`Downloading file from Dropbox: ${filename}`)

    const response = await axios({
      method: 'GET',
      url: directUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 60000,
      maxRedirects: 5
    })

    const writer = fs.createWriteStream(destPath)
    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    const metadata = await extractMetadata(destPath)
    const stats = fs.statSync(destPath)

    const trackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const trackTitle = title || metadata.title
    const trackArtist = artist || metadata.artist

    db.prepare(`
      INSERT INTO tracks (id, title, artist, type, src, duration, file_path, file_size)
      VALUES (?, ?, ?, 'local', ?, ?, ?, ?)
    `).run(
      trackId,
      trackTitle,
      trackArtist,
      `/music/${filename}`,
      metadata.duration,
      destPath,
      stats.size
    )

    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId)

    console.log(`File downloaded and saved: ${trackTitle} - ${trackArtist}`)

    res.json({
      success: true,
      track
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
