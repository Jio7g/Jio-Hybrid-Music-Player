import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseFile } from 'music-metadata'
import db from '../config/database.js'
import AdmZip from 'adm-zip'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEMP_DIR = path.join(__dirname, '../temp')

// Asegurar que existe directorio temporal
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

/**
 * Descarga el ZIP de la carpeta de Dropbox y lista su contenido
 */
export async function scanDropboxFolder(folderUrl) {
  try {
    console.log('Scanning Dropbox folder via ZIP method...')
    
    // Asegurar que la URL termina en dl=1 para descargar como ZIP
    let zipUrl = folderUrl.replace(/[?&]dl=0/, '')
    zipUrl += zipUrl.includes('?') ? '&dl=1' : '?dl=1'
    
    const zipPath = path.join(TEMP_DIR, `scan_${Date.now()}.zip`)
    
    console.log('Downloading ZIP...', zipUrl)
    
    // Descargar ZIP
    const response = await axios({
      method: 'GET',
      url: zipUrl,
      responseType: 'arraybuffer'
    })
    
    fs.writeFileSync(zipPath, response.data)
    console.log('ZIP downloaded, size:', response.data.length)

    // Leer ZIP
    const zip = new AdmZip(zipPath)
    const zipEntries = zip.getEntries()
    
    const files = []
    
    zipEntries.forEach(entry => {
      if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.mp3')) {
        // Ignorar archivos que empiecen por ._ (macOS metadata)
        if (!path.basename(entry.entryName).startsWith('._')) {
          files.push({
            filename: path.basename(entry.entryName),
            // Guardamos la ruta interna del zip para extracción posterior
            internalPath: entry.entryName,
            // La URL aquí es referencial, usaremos el ZIP cacheado para importar
            url: zipUrl,
            tempZipPath: zipPath
          })
        }
      }
    })
    
    console.log(`Found ${files.length} MP3 files in ZIP`)
    
    // Limpiar zips viejos (opcional, o dejarlo para que importTracks lo use)
    // Por ahora dejamos el ZIP ahí para que importTracks lo use
    
    return files
  } catch (error) {
    console.error('Error scanning Dropbox ZIP:', error.message)
    throw new Error('Failed to scan Dropbox folder. Make sure the link is public.')
  }
}

/**
 * Importa tracks desde el ZIP descargado previamente
 */
export async function importTracks(tracks, storagePath) {
  const results = {
    added: [],
    failed: []
  }

  // Asegurar que existe el directorio de almacenamiento
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true })
  }

  // Agrupar por archivo ZIP origen para optimizar lecturas
  const tracksByZip = {}
  tracks.forEach(t => {
    const zipPath = t.tempZipPath
    if (!tracksByZip[zipPath]) tracksByZip[zipPath] = []
    tracksByZip[zipPath].push(t)
  })

  for (const [zipPath, tracksToImport] of Object.entries(tracksByZip)) {
    try {
      if (!fs.existsSync(zipPath)) {
        throw new Error('Cached ZIP file not found. Please scan again.')
      }

      const zip = new AdmZip(zipPath)

      for (const track of tracksToImport) {
        try {
          const filename = track.filename
          const destPath = path.join(storagePath, filename)
          
          console.log(`Extracting: ${filename}`)
          
          // Extraer archivo específico
          const entry = zip.getEntry(track.internalPath)
          if (!entry) {
            throw new Error('File not found inside ZIP')
          }
          
          // Extraer al disco
          zip.extractEntryTo(entry, storagePath, false, true)
          
          // Renombrar si es necesario (extractEntryTo usa el nombre original)
          // AdmZip extrae con la estructura de carpetas, así que movemos el archivo si quedó en subcarpeta
          const extractedPath = path.join(storagePath, entry.entryName)
          if (extractedPath !== destPath) {
             // Si se extrajo en subcarpeta, moverlo a la raíz de music/
             if (fs.existsSync(extractedPath)) {
               fs.renameSync(extractedPath, destPath)
               // Intentar borrar carpetas vacías residuales
               const dir = path.dirname(extractedPath)
               if (dir !== storagePath && fs.readdirSync(dir).length === 0) {
                 fs.rmdirSync(dir)
               }
             }
          }

          // Extraer metadatos y guardar en DB
          const metadata = await extractMetadata(destPath)
          
          // Verificar si ya está en DB
          const existingTrack = db.prepare("SELECT id FROM tracks WHERE file_path = ?").get(destPath)
          
          if (!existingTrack) {
            const trackId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const stats = fs.statSync(destPath)

            db.prepare(`
              INSERT INTO tracks (id, title, artist, type, src, cover, duration, file_path, file_size)
              VALUES (?, ?, ?, 'local', ?, ?, ?, ?, ?)
            `).run(
              trackId,
              metadata.title,
              metadata.artist,
              `/music/${filename}`,
              metadata.cover,
              metadata.duration,
              destPath,
              stats.size
            )
            
            results.added.push({
              id: trackId,
              title: metadata.title,
              artist: metadata.artist
            })
          } else {
            console.log(`Track already in DB: ${filename}`)
          }

        } catch (err) {
          console.error(`Failed to import ${track.filename}:`, err)
          results.failed.push({ filename: track.filename, error: err.message })
        }
      }
      
      // Limpiar ZIP después de usarlo
      try {
        fs.unlinkSync(zipPath)
      } catch (e) {
        console.warn('Could not delete temp zip:', e)
      }

    } catch (error) {
      console.error('Error processing ZIP:', error)
      tracksToImport.forEach(t => results.failed.push({ filename: t.filename, error: error.message }))
    }
  }

  return results
}

// ...existing code...
/**
 * Convierte URL de carpeta compartida de Dropbox a URL de listado de archivos

 * Dropbox API no oficial usando web scraping de la página pública
 */
function parseDropboxFolderUrl(url) {
  // Convertir URL de carpeta a formato de API
  // Ejemplo: https://www.dropbox.com/scl/fo/xxx/yyy?rlkey=zzz&st=www&dl=0
  // A: https://www.dropbox.com/scl/fo/xxx/yyy?rlkey=zzz&st=www&dl=1

  if (!url.includes('dropbox.com')) {
    throw new Error('Not a valid Dropbox URL')
  }

  // Asegurar que dl=1 para descarga directa
  let parsedUrl = url.replace(/[?&]dl=0/, '?dl=1')
  if (!parsedUrl.includes('dl=')) {
    parsedUrl += url.includes('?') ? '&dl=1' : '?dl=1'
  }

  return parsedUrl
}




/**
 * Extrae metadatos de un archivo MP3
 */
async function extractMetadata(filePath) {
  try {
    const metadata = await parseFile(filePath)

    return {
      title: metadata.common.title || path.basename(filePath, '.mp3'),
      artist: metadata.common.artist || 'Unknown Artist',
      duration: metadata.format.duration || 0,
      cover: null // Podrías extraer la portada si existe
    }
  } catch (error) {
    console.warn('Could not extract metadata:', error.message)
    return {
      title: path.basename(filePath, '.mp3'),
      artist: 'Unknown Artist',
      duration: 0,
      cover: null
    }
  }
}


/**
 * Obtiene el historial de sincronizaciones
 */
export function getSyncHistory(limit = 10) {
  return db.prepare(`
    SELECT * FROM sync_history
    ORDER BY synced_at DESC
    LIMIT ?
  `).all(limit)
}

// ...existing code...
/**
 * Escanea una carpeta de Dropbox y devuelve la lista de archivos encontrados
 * (Mantenemos la exportación antigua por compatibilidad si se usaba en otro lado, pero ahora usa la lógica ZIP)
 */
// export async function scanDropboxFolder(folderUrl) { ... } // Ya definida arriba

// ...existing code...
