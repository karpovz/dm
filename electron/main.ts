import path from 'node:path'
import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain } from 'electron'
import {
  checkDbHealth,
  closePool,
  createProduct,
  deleteProduct,
  findAuthUser,
  listProducts,
  listPublicTables,
  updateProduct,
  type ProductDto,
  type ProductListOptions,
} from './db/postgres'

dotenv.config()

let mainWindow: BrowserWindow | null = null

function createMainWindow(): void {
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(path.join(__dirname, 'renderer-dist/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('health:check', async () => {
    try {
      const db = await checkDbHealth()
      return { ok: true, db }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown database error',
      }
    }
  })

  ipcMain.handle('db:tables', async () => {
    try {
      const tables = await listPublicTables()
      return { ok: true, tables }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to query tables',
      }
    }
  })

  ipcMain.handle('auth:login', async (_event, payload: { login?: string; password?: string }) => {
    const login = payload?.login?.trim()
    const password = payload?.password

    if (!login || !password) {
      return { ok: false, message: 'Login and password are required' }
    }

    try {
      const user = await findAuthUser(login, password)
      if (!user) {
        return { ok: false, message: 'Invalid login or password' }
      }
      return { ok: true, user }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to authorize user',
      }
    }
  })

  ipcMain.handle('products:list', async (_event, payload?: ProductListOptions) => {
    try {
      const result = await listProducts(payload ?? {})
      return { ok: true, ...result }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load products',
      }
    }
  })

  ipcMain.handle('products:create', async (_event, payload?: ProductDto) => {
    try {
      if (!payload) {
        return { ok: false, message: 'Product data is required' }
      }
      const item = await createProduct(payload)
      return { ok: true, item }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product'
      return { ok: false, message }
    }
  })

  ipcMain.handle('products:update', async (_event, payload: { article?: string; product?: ProductDto }) => {
    const article = payload?.article?.trim()
    if (!article) {
      return { ok: false, message: 'Article is required' }
    }

    try {
      if (!payload.product) {
        return { ok: false, message: 'Product data is required' }
      }
      const item = await updateProduct(article, payload.product)
      if (!item) {
        return { ok: false, message: 'Product not found' }
      }
      return { ok: true, item }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product'
      return { ok: false, message }
    }
  })

  ipcMain.handle('products:delete', async (_event, payload: { article?: string }) => {
    const article = payload?.article?.trim()
    if (!article) {
      return { ok: false, message: 'Article is required' }
    }

    try {
      const deleted = await deleteProduct(article)
      if (!deleted) {
        return { ok: false, message: 'Product not found' }
      }
      return { ok: true }
    } catch (error) {
      const dbError = error as { code?: string }
      if (dbError?.code === '23503') {
        return { ok: false, message: 'Нельзя удалить товар, который используется в заказах' }
      }
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to delete product',
      }
    }
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  void closePool()
})
