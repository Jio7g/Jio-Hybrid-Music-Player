# Hybrid Music Player

Reproductor de música moderno construido con Vue 3, TypeScript y Tailwind CSS que reproduce archivos MP3, Dropbox, Google Drive y videos de YouTube en una playlist unificada. Incluye backend con sincronización de carpetas de Dropbox.

## Características

### Frontend

- **Reproducción Híbrida**: Mezcla MP3, Dropbox, Google Drive y YouTube en la misma playlist
- **UI Moderna**: Modo oscuro, diseño limpio con Tailwind CSS
- **Gestión de Estado**: Powered by Pinia para estado reactivo
- **Patrón Adapter**: Arquitectura limpia para manejar múltiples tipos de media
- **Persistencia**: LocalStorage + Backend con SQLite
- **Modo Loop**: Reproducción en bucle de playlists
- **Responsive**: Funciona en desktop y móvil

### Backend

- **API REST**: CRUD completo para tracks y playlists
- **Sincronización Dropbox**: Descarga automática de música desde carpetas públicas
- **Extracción de Metadatos**: Lee título, artista y duración de archivos MP3
- **Base de Datos SQLite**: Persistencia de playlists y tracks
- **Servicio de Windows**: Auto-inicio con el sistema operativo
- **Almacenamiento Local**: Archivos MP3 en el servidor para reproducción offline

## Arquitectura

### Patrones de Diseño

- **Adapter Pattern**: `usePlayerAdapter` composable proporciona interfaz unificada para MP3/Dropbox (`HTMLAudioElement`) y YouTube (`YouTube IFrame API`)
- **Singleton Pattern**: `playerService` asegura una sola instancia del adapter
- **Composition API**: Enfoque moderno de Vue 3 con composables para lógica reutilizable
- **Store Pattern**: Gestión de estado centralizada con Pinia

### Tech Stack

**Frontend:**

- Vue 3 + Composition API
- TypeScript
- Pinia (state management)
- Tailwind CSS v3
- Vite
- YouTube IFrame API

**Backend:**

- Node.js + Express 5
- SQLite (better-sqlite3)
- music-metadata (extracción de metadatos)
- Axios (descarga de archivos)

## Instalación (Producción)

### Opción 1: Instalador Automático (Recomendado)

1. Descargar y ejecutar **`HybridMusicPlayer_Setup.exe`**.
2. Seguir las instrucciones del asistente.
   - Instala el sistema en `Archivos de Programa`.
   - Configura el Firewall de Windows.
   - Inicia el servicio automáticamente.

### Opción 2: Instalación Manual

1. Copiar la carpeta de release al servidor.
2. Ejecutar `setup.bat` como Administrador.

### Generar el Instalador

Para generar el instalador `.exe` desde el código fuente:

```bash
# Requiere NSIS instalado (sudo apt install nsis)
node scripts/build-release.js
```

## Desarrollo

Para iniciar el entorno de desarrollo (Frontend + Backend) con un solo comando:

### Linux / Mac

```bash
./start-dev.sh
```

### Windows

```powershell
./start-dev.ps1
```

Esto iniciará:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Configuración Inicial

1. Copiar `.env.example` a `.env` en la carpeta `backend`.
2. Configurar la URL de Dropbox si es necesario.

## Uso

### Agregar Música

**Opción 1: Sincronizar desde Dropbox (Recomendado)**

1. Subir MP3s a carpeta de Dropbox
2. Hacer clic en "Sincronizar con Dropbox"
3. Los archivos se descargan al servidor
4. Reproducción rápida y offline

**Opción 2: Agregar manualmente**

1. Hacer clic en "Add Track"
2. Seleccionar tipo (MP3, Dropbox, YouTube)
3. Ingresar título, artista y URL
4. Guardar

### Tipos de URLs Soportadas

**MP3 Directo:**

```
https://example.com/song.mp3
```

**Dropbox (archivo individual):**

```
https://www.dropbox.com/s/abc123/song.mp3?dl=0
```

**Google Drive (limitado por CORS):**

```
https://drive.google.com/file/d/FILE_ID/view
```

**YouTube:**

```
https://www.youtube.com/watch?v=VIDEO_ID
```

### Controles del Reproductor

- **Play/Pause**: Reproducir o pausar canción actual
- **Next/Previous**: Navegar entre canciones
- **Loop**: Activar/desactivar repetición de playlist
- **Volume**: Ajustar volumen
- **Progress Bar**: Hacer clic para saltar a una posición

## API Backend

### Endpoints principales

```
GET    /api/tracks              # Listar todos los tracks
POST   /api/tracks              # Crear track
DELETE /api/tracks/:id          # Eliminar track

GET    /api/playlists           # Listar playlists
POST   /api/playlists           # Crear playlist
GET    /api/playlists/:id       # Obtener playlist con tracks

POST   /api/sync/dropbox        # Sincronizar carpeta Dropbox
GET    /api/sync/history        # Historial de sincronizaciones

GET    /music/:filename         # Servir archivo MP3
```

Ver documentación completa en [backend/README.md](backend/README.md)

## Estructura del Proyecto

```
reproductor-mp3/
├── frontend/               # (Integrado en raíz)
│   ├── src/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   ├── stores/
│   │   └── App.vue
│   └── index.html
│
├── backend/
│   ├── config/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   ├── install-service.js
│   └── uninstall-service.js
│
├── scripts/
│   └── build-release.js    # Script de generación de instalador
│
├── release/                # Carpeta de salida del instalador
│
├── start-dev.sh            # Script desarrollo Linux/Mac
├── start-dev.ps1           # Script desarrollo Windows
└── README.md

```

## Docker Deployment

```bash
# Build
docker build -t hybrid-music-player .

# Run
docker run -p 8080:80 -p 3001:3001 hybrid-music-player

# Docker Compose
docker-compose up -d
```

## Troubleshooting

### YouTube no reproduce

- Asegurar que el iframe sea visible (320x180px en esquina inferior derecha)
- Verificar que la URL de YouTube sea válida
- Revisar console del navegador para errores de CORS

### Dropbox no sincroniza

- Verificar que la URL de carpeta sea pública
- Asegurar que la carpeta contenga archivos .mp3
- Revisar logs del backend para detalles del error

### Botón de pausa no funciona

- Verificar que solo hay una instancia del adapter (usando `getPlayerAdapter()`)
- Revisar que el frontend esté conectado al backend

### Base de datos se borra al reiniciar

- Verificar que `db.sqlite` existe en `backend/`
- Asegurar permisos de escritura en el directorio

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir Pull Request

## Soporte

Para reportar bugs o solicitar features, abrir un issue en GitHub.
