# Quick Start Guide

## Inicio Rápido

### Opción 1: Script Automático (Linux/Mac)

```bash
./start-dev.sh
```

Este script:
- Instala dependencias si es necesario
- Inicia el backend en puerto 3001
- Inicia el frontend en puerto 5173

### Opción 2: Manual

#### 1. Iniciar Backend

```bash
cd backend
npm install
npm start
```

El backend estará disponible en `http://localhost:3001`

#### 2. Iniciar Frontend (en otra terminal)

```bash
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Configuración Inicial

### 1. Configurar Dropbox (Opcional)

Si deseas sincronizar música desde Dropbox:

1. Sube archivos MP3 a una carpeta de Dropbox
2. Comparte la carpeta y obtén el enlace público
3. Edita `backend/.env`:

```env
DROPBOX_FOLDER_URL=https://www.dropbox.com/scl/fo/xxx/yyy?rlkey=zzz&st=www&dl=0
```

### 2. Primera Sincronización

1. Abre `http://localhost:5173`
2. Haz clic en el botón verde "Sync Dropbox"
3. Los archivos MP3 se descargarán al servidor
4. Las canciones aparecerán en la playlist

## Uso

### Agregar Música

**Método 1: Sincronización Dropbox (Recomendado)**
- Click en "Sync Dropbox"
- Los MP3 se descargan al servidor
- Reproducción rápida y offline

**Método 2: Agregar Manualmente**
- Click en "Add Track"
- Seleccionar tipo (MP3, Dropbox, YouTube)
- Ingresar datos y URL

### Controles

- **Play/Pause**: Reproducir o pausar
- **Next/Previous**: Cambiar canción
- **Loop** (ícono de repetición): Activar/desactivar bucle
- **Volume**: Ajustar volumen
- **Progress Bar**: Click para saltar a una posición

## URLs de Ejemplo

### Dropbox (archivo individual)
```
https://www.dropbox.com/s/abc123/song.mp3?dl=0
```

### YouTube
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### MP3 Directo
```
https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
```

## Troubleshooting

### Backend no inicia

```bash
cd backend
rm -rf node_modules
npm install
npm start
```

### Frontend no conecta con backend

Verificar que `VITE_API_URL` en `.env` apunte a `http://localhost:3001/api`

### Dropbox no sincroniza

1. Verificar que la URL de carpeta sea pública
2. Revisar logs del backend
3. Asegurar que la carpeta contenga archivos .mp3

## Producción

### Instalar como Servicio de Windows

```bash
cd backend
npm install -g node-windows
# Ejecutar como Administrador
node install-service.js
```

El servidor se iniciará automáticamente con Windows.

## Más Información

Ver [README.md](README.md) para documentación completa.
