# Comandos Útiles

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev

# Compilar para producción
npm run build

# Vista previa de build de producción
npm run preview

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## Docker

```bash
# Construir imagen Docker
docker build -t hybrid-music-player .

# Ejecutar contenedor (accesible en http://localhost:8080)
docker run -d -p 8080:80 --name music-player hybrid-music-player

# Ver logs del contenedor
docker logs music-player

# Detener contenedor
docker stop music-player

# Eliminar contenedor
docker rm music-player

# Eliminar imagen
docker rmi hybrid-music-player
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes Vue
│   ├── PlayerControls.vue    # Controles del reproductor (barra inferior)
│   ├── Playlist.vue           # Lista de reproducción
│   └── TrackItem.vue          # Elemento individual de la playlist
├── composables/         # Lógica reutilizable
│   └── usePlayerAdapter.ts    # Adaptador MP3/YouTube (Patrón Adapter)
├── stores/             # Estado global con Pinia
│   └── player.ts              # Store del reproductor
├── types/              # Definiciones TypeScript
│   ├── index.ts               # Tipos principales
│   └── youtube.d.ts           # Tipos de YouTube API
├── App.vue             # Componente raíz
├── main.ts             # Punto de entrada
└── style.css           # Estilos globales (Tailwind)
```

## Ejemplos de Uso

### Añadir una canción MP3

```typescript
const track: Track = {
  id: 'unique-id',
  title: 'My Song',
  artist: 'Artist Name',
  type: 'mp3',
  src: 'https://example.com/song.mp3',
  cover: 'https://example.com/cover.jpg' // Opcional
}

store.addTrack(track)
```

### Añadir un video de YouTube

```typescript
const track: Track = {
  id: 'unique-id',
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  type: 'youtube',
  src: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
  cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' // Opcional
}

store.addTrack(track)
```

## Características Principales

### Patrón Adapter
El sistema utiliza el patrón Adapter para abstraer la reproducción:
- **MP3**: Utiliza `HTMLAudioElement` nativo del navegador
- **YouTube**: Utiliza `YouTube IFrame API`
- Interfaz unificada: `play()`, `pause()`, `stop()`, `seek()`, `setVolume()`

### Gestión de Estado (Pinia)
- **Estado reactivo**: Playlist, track actual, estado de reproducción
- **Acciones**: Añadir/eliminar tracks, navegación, controles
- **Getters**: Progreso, siguiente/anterior disponible

### Interfaz de Usuario
- **Dark Mode**: Tema oscuro por defecto
- **Responsive**: Adaptado a móviles y desktop
- **Componentes modulares**: Fácil de extender y mantener
- **Feedback visual**: Indicadores de reproducción, hover states

## Tecnologías

- **Vue 3** (Composition API)
- **TypeScript** (Type Safety)
- **Pinia** (State Management)
- **Tailwind CSS** (Styling)
- **Vite** (Build Tool)
- **YouTube IFrame API** (YouTube Playback)
