# Hybrid Music Player - Backend

Backend del reproductor de música híbrido con sincronización de Dropbox/Google Drive.

## Características

- API REST para gestión de tracks y playlists
- Sincronización automática con carpetas de Dropbox
- Almacenamiento local de archivos MP3
- Extracción automática de metadatos (título, artista, duración)
- Base de datos SQLite persistente
- Servicio de Windows para auto-inicio

## Requisitos

- Node.js >= 18
- Windows 11 (para instalación como servicio)

## Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```env
PORT=3001
DROPBOX_FOLDER_URL=https://www.dropbox.com/scl/fo/xxx/yyy?rlkey=zzz&st=www&dl=0
MUSIC_STORAGE_PATH=./music
FRONTEND_URL=http://localhost:5173
```

### 3. Iniciar servidor (desarrollo)

```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## Instalación como Servicio de Windows

Para que el servidor se inicie automáticamente con Windows:

### 1. Instalar node-windows

```bash
npm install -g node-windows
```

### 2. Ejecutar instalador (como Administrador)

Hacer clic derecho en `install-service.bat` y seleccionar "Ejecutar como administrador"

O desde línea de comandos:

```bash
node install-service.js
```

### 3. Gestionar el servicio

```bash
# Iniciar servicio
sc start HybridMusicPlayer

# Detener servicio
sc stop HybridMusicPlayer

# Ver estado
sc query HybridMusicPlayer

# Desinstalar servicio
node uninstall-service.js
```

## API Endpoints

### Tracks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tracks` | Obtener todos los tracks |
| GET | `/api/tracks/:id` | Obtener track por ID |
| POST | `/api/tracks` | Crear nuevo track |
| PUT | `/api/tracks/:id` | Actualizar track |
| DELETE | `/api/tracks/:id` | Eliminar track |

### Playlists

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/playlists` | Obtener todas las playlists |
| GET | `/api/playlists/:id` | Obtener playlist con tracks |
| POST | `/api/playlists` | Crear nueva playlist |
| PUT | `/api/playlists/:id` | Actualizar playlist |
| DELETE | `/api/playlists/:id` | Eliminar playlist |
| POST | `/api/playlists/:id/tracks` | Agregar track a playlist |
| DELETE | `/api/playlists/:id/tracks/:track_id` | Quitar track de playlist |

### Sincronización

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/sync/dropbox` | Sincronizar carpeta de Dropbox |
| GET | `/api/sync/history` | Obtener historial de sincronizaciones |

### Archivos estáticos

| Ruta | Descripción |
|------|-------------|
| `/music/:filename` | Servir archivos MP3 |

## Sincronización con Dropbox

### Configuración

1. Subir archivos MP3 a una carpeta de Dropbox
2. Compartir la carpeta y obtener el enlace público
3. Configurar `DROPBOX_FOLDER_URL` en `.env`

### Ejecutar sincronización

Desde el frontend, hacer clic en "Sincronizar con Dropbox"

O manualmente via API:

```bash
curl -X POST http://localhost:3001/api/sync/dropbox
```

### Cómo funciona

1. El backend descarga el HTML de la carpeta pública de Dropbox
2. Extrae las URLs de archivos `.mp3`
3. Descarga solo los archivos nuevos
4. Extrae metadatos (título, artista, duración)
5. Guarda en base de datos SQLite
6. Elimina archivos que ya no existen en Dropbox

## Estructura de Base de Datos

### Tabla: tracks

```sql
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  type TEXT NOT NULL,
  src TEXT NOT NULL,
  cover TEXT,
  duration REAL,
  file_path TEXT,
  file_size INTEGER,
  created_at DATETIME,
  updated_at DATETIME
)
```

### Tabla: playlists

```sql
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

### Tabla: playlist_tracks

```sql
CREATE TABLE playlist_tracks (
  playlist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at DATETIME,
  PRIMARY KEY (playlist_id, track_id)
)
```

### Tabla: sync_history

```sql
CREATE TABLE sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  tracks_added INTEGER,
  tracks_removed INTEGER,
  status TEXT,
  error_message TEXT,
  synced_at DATETIME
)
```

## Desarrollo

### Iniciar en modo watch

```bash
npm run dev
```

### Estructura de archivos

```
backend/
├── config/
│   └── database.js          # Configuración de SQLite
├── routes/
│   ├── tracks.js            # CRUD de tracks
│   ├── playlists.js         # CRUD de playlists
│   └── sync.js              # Sincronización
├── services/
│   └── dropboxSync.js       # Lógica de sincronización
├── server.js                # Servidor principal
├── package.json
├── .env                     # Variables de entorno
├── db.sqlite                # Base de datos
└── music/                   # Archivos MP3 descargados
```

## Troubleshooting

### El servidor no inicia

- Verificar que el puerto 3001 no esté en uso
- Revisar permisos de escritura en carpeta `music/`
- Verificar que `.env` esté configurado correctamente

### Sincronización falla

- Verificar que la URL de Dropbox sea válida y pública
- Asegurar que la carpeta contenga archivos `.mp3`
- Revisar logs del servidor para detalles del error

### Servicio de Windows no inicia

- Ejecutar `install-service.bat` como Administrador
- Verificar que Node.js esté en el PATH
- Revisar Event Viewer de Windows para errores

## Licencia

MIT
