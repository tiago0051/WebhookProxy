import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { io } from 'socket.io-client'
import axios, { isAxiosError } from 'axios'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('start_proxy', (_e, data: { proxyUrl: string; verifierCode: string }) => {
    startSocket(data.proxyUrl, data.verifierCode)
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function startSocket(baseUrl: string, verifierCode: string): void {
  const socket = io(`https://webhook-proxy.devsoftbr.com`, {
    auth: {
      verifierCode
    }
  })

  socket.on(
    'http_request',
    async (data: {
      method: string
      headers?: Record<string, string>
      body?: unknown
      params?: Record<string, string>
      code: number
    }) => {
      let response
      try {
        switch (data.method) {
          case 'GET':
            response = await axios.get(baseUrl, {
              params: data.params
            })
            break
          case 'POST':
            response = await axios.post(baseUrl, data.body, {
              params: data.params
            })
            break
        }
      } catch (error) {
        if (isAxiosError(error)) {
          response = error.response
        }

        throw error
      }

      socket.emit('http_response', {
        data: response.data,
        status: response.status,
        code: data.code
      })
    }
  )
}
