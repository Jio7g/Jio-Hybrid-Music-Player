import { Service } from 'node-windows'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const svc = new Service({
  name: 'HybridMusicPlayer',
  script: path.join(__dirname, 'server.js')
})

svc.on('uninstall', () => {
  console.log('Service uninstalled successfully')
})

svc.on('alreadyuninstalled', () => {
  console.log('Service is not installed')
})

svc.on('error', err => {
  console.error('Error:', err)
})

console.log('Uninstalling Windows Service...')
svc.uninstall()
