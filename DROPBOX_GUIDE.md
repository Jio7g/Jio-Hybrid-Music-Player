# Guía Rápida: Usar Dropbox con el Reproductor

## ✅ ¿Por qué Dropbox en lugar de Google Drive?

Dropbox funciona perfectamente porque:
- ✅ **Sin problemas de CORS**: Permite streaming directo
- ✅ **URL simple**: Solo cambiar `?dl=0` por `?dl=1`
- ✅ **Streaming directo**: El navegador puede reproducir sin descargar
- ✅ **Sin autenticación**: Los enlaces públicos funcionan directamente

## 📝 Cómo Usar (3 Pasos)

### Paso 1: Sube tu archivo a Dropbox
1. Ve a [dropbox.com](https://www.dropbox.com)
2. Sube tu archivo MP3/audio

### Paso 2: Obtén el enlace compartible
1. Haz clic derecho en el archivo
2. Selecciona **"Compartir"** o **"Copy link"**
3. Copia el enlace que recibes

**Ejemplo de enlace:**
```
https://www.dropbox.com/s/abc123xyz/mi_cancion.mp3?dl=0
```

### Paso 3: Agrega al reproductor
1. En el reproductor, haz clic en **"Add Track"**
2. Completa:
   - **Title**: Nombre de la canción
   - **Artist**: Artista
   - **Type**: Selecciona **"Dropbox"**
   - **Source URL**: Pega el enlace de Dropbox (con `?dl=0` o `?dl=1`, cualquiera funciona)
3. Haz clic en **"Add Track"**

## 🎵 Ejemplo Completo

```
Title: Adiemus
Artist: Karl Jenkins
Type: Dropbox
Source URL: https://www.dropbox.com/s/abc123xyz/adiemus.mp3?dl=0
```

El reproductor automáticamente convierte el enlace al formato correcto.

## 💡 Consejos

1. **No necesitas cambiar manualmente** `?dl=0` por `?dl=1` - el reproductor lo hace automáticamente
2. **Dropbox gratis**: 2GB de almacenamiento gratuito
3. **Calidad**: Mantiene la calidad original del archivo
4. **Formatos soportados**: MP3, WAV, FLAC, M4A, OGG

## ⚡ Comparación

| Servicio | Funciona | Facilidad | CORS | Calidad |
|----------|----------|-----------|------|---------|
| **Dropbox** | ✅ Perfecto | ⭐⭐⭐⭐⭐ | ✅ Sin problemas | 🎵 100% |
| Google Drive | ⚠️ Limitado | ⭐⭐ | ❌ Bloqueado | 🎵 100% |
| MP3 Directo | ✅ Perfecto | ⭐⭐⭐⭐ | ⚠️ Depende | 🎵 100% |
| YouTube | ✅ Perfecto | ⭐⭐⭐⭐⭐ | ✅ API oficial | 🎵 Variable |

## 🔧 Solución de Problemas

### "El audio no se reproduce"
1. Verifica que el enlace sea de Dropbox (contiene `dropbox.com`)
2. Asegúrate de que el archivo sea de audio (MP3, WAV, etc.)
3. Prueba descargando el archivo manualmente desde el enlace

### "Error de red"
1. Verifica tu conexión a internet
2. Intenta con otro archivo
3. Asegúrate de que Dropbox esté accesible desde tu navegador

## 📱 Ventajas de Dropbox

- 🚀 **Rápido**: Streaming instantáneo
- 🔒 **Seguro**: Enlaces privados pero compartibles
- 🌐 **Universal**: Funciona en todos los navegadores
- 💻 **Sin servidor**: No necesitas tu propio hosting

## 🎯 Resumen

**Dropbox es la opción RECOMENDADA** para almacenar y reproducir tu música en este reproductor híbrido por su facilidad de uso y compatibilidad perfecta.

---

¿Prefieres no usar servicios en la nube? Considera hostear tus MP3 en:
- GitHub Pages (repositorios públicos)
- Netlify/Vercel (gratis)
- Tu propio servidor web
