# Guía de Instalación para Windows 11 / Windows Server

Esta guía detalla cómo generar el instalador del **Hybrid Music Player** y desplegarlo en un servidor o máquina con Windows 11.

## Prerrequisitos

### En la máquina de desarrollo (donde se compila):

- **Node.js** (v18 o superior)
- **NPM** (incluido con Node.js)

### En el servidor / máquina destino (donde se instalará):

- **Windows 10, 11 o Windows Server**
- **Node.js** instalado (Descargar de [nodejs.org](https://nodejs.org/))
- Acceso a Internet (para descargar dependencias la primera vez) o copiar la carpeta `node_modules` si es offline.

---

## Paso 1: Generar el Paquete de Instalación

Antes de copiar los archivos al servidor, debes generar la versión "release" optimizada.

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando:

   ```powershell
   node scripts/build-release.js
   ```

3. Al finalizar, verás una nueva carpeta llamada `release` en la raíz del proyecto.
   - Si tienes **NSIS** instalado, se generará un archivo **`HybridMusicPlayer_Setup.exe`**.
   - Si no, tendrás el script `setup.bat` y los archivos sueltos.

---

## Paso 2: Despliegue en el Servidor

1. Copia el archivo **`HybridMusicPlayer_Setup.exe`** (o la carpeta `release` completa si no usas el .exe) a la máquina destino.

---

## Paso 3: Instalación

### Opción A: Usando el Instalador (.exe) - Recomendado

1. Haz doble clic en **`HybridMusicPlayer_Setup.exe`**.
2. Sigue las instrucciones del asistente de instalación.
   - Se instalará en `Archivos de Programa`.
   - Se configurará el Firewall de Windows automáticamente.
   - Se iniciará el servicio automáticamente.

### Opción B: Instalación Manual (setup.bat)

1. En la máquina destino, abre la carpeta donde copiaste los archivos.
2. Haz clic derecho sobre el archivo **`setup.bat`**.
3. Selecciona **"Ejecutar como administrador"** (Run as Administrator).
4. Se abrirá una ventana negra (consola) realizando los siguientes pasos:
   - Verificará si Node.js está instalado.
   - Instalará las dependencias necesarias.
   - Registrará el servicio "HybridMusicPlayer".
   - Configurará el Firewall de Windows.
   - Iniciará el servicio.

Si todo sale bien, verás el mensaje **"Installation Complete!"**.

---

## Paso 4: Acceder al Sistema

Una vez instalado, el sistema estará disponible en el puerto **3001**.

### Desde la misma máquina (Local):

Abre tu navegador y visita:
[http://localhost:3001](http://localhost:3001)

### Desde otra máquina en la red (LAN):

Necesitas saber la dirección IP del servidor (ej. `192.168.1.10`).
Abre el navegador en cualquier dispositivo de la red y visita:
`http://192.168.1.10:3001`

> **Nota sobre el Firewall:** Si no puedes acceder desde otra máquina, asegúrate de crear una regla de entrada en el Firewall de Windows para permitir el puerto **3001** (TCP).

---

## Gestión del Servicio

### Detener o Reiniciar

Puedes gestionar el servicio desde el administrador de "Servicios" de Windows (`services.msc`), buscando **"HybridMusicPlayer"**.

### Desinstalación

Si deseas eliminar el servicio por completo:

1. Abre una terminal (CMD o PowerShell) como Administrador.
2. Navega a la carpeta `backend` dentro de tu instalación.
3. Ejecuta:
   ```powershell
   node uninstall-service.js
   ```
