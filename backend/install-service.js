import { Service } from 'node-windows'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Crear servicio de Windows
const svc = new Service({
  name: 'HybridMusicPlayer',
  description: 'Hybrid Music Player Backend Server with Dropbox Sync',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
})

svc.on('install', () => {
  console.log('Service installed successfully')
  console.log('Starting service...')
  svc.start()
})

svc.on('alreadyinstalled', () => {
  console.log('Service is already installed')
})

svc.on('start', () => {
  console.log('Service started successfully')
})

svc.on('error', err => {
  console.error('Error:', err)
})

// Instalar servicio
console.log('Installing Windows Service...')
svc.install()
