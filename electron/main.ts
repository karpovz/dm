import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain } from 'electron'
import {
  checkDbHealth,
  closePool,
  createProduct,
  deleteProduct,
  findAuthUser,
  getProductByArticle,
  listProducts,
  listPublicTables,
  updateProduct,
  type ProductDto,
  type ProductListOptions,
} from './db/postgres'

dotenv.config()

let mainWindow: BrowserWindow | null = null

function ensureAdmin(actorRoleCode?: string) {
  if (actorRoleCode !== 'admin') {
    throw new Error('Это действие доступно только администратору')
  }
}

function getImagesDirectoryPath() {
  return path.join(process.cwd(), 'public', 'images')
}

function parseImageDataUrl(dataUrl: string): { buffer: Buffer; ext: string } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/)
  if (!match) {
    throw new Error('Поддерживаются только изображения PNG/JPEG/WEBP/GIF')
  }

  const mime = match[1]
  const raw = match[2]
  const ext = mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : mime.replace('image/', '')
  return { buffer: Buffer.from(raw, 'base64'), ext }
}

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

  ipcMain.handle('products:get', async (_event, payload?: { article?: string }) => {
    const article = payload?.article?.trim()
    if (!article) {
      return { ok: false, message: 'Article is required' }
    }

    try {
      const item = await getProductByArticle(article)
      if (!item) {
        return { ok: false, message: 'Product not found' }
      }
      return { ok: true, item }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load product',
      }
    }
  })

  ipcMain.handle('products:create', async (_event, payload?: { product?: ProductDto; actorRoleCode?: string }) => {
    try {
      ensureAdmin(payload?.actorRoleCode)
      if (!payload?.product) {
        return { ok: false, message: 'Product data is required' }
      }
      const item = await createProduct(payload.product)
      return { ok: true, item }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product'
      return { ok: false, message }
    }
  })

  ipcMain.handle(
    'products:update',
    async (_event, payload: { article?: string; product?: ProductDto; actorRoleCode?: string }) => {
      const article = payload?.article?.trim()
      if (!article) {
        return { ok: false, message: 'Article is required' }
      }

      try {
        ensureAdmin(payload?.actorRoleCode)
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
    },
  )

  ipcMain.handle('products:delete', async (_event, payload: { article?: string; actorRoleCode?: string }) => {
    const article = payload?.article?.trim()
    if (!article) {
      return { ok: false, message: 'Article is required' }
    }

    try {
      ensureAdmin(payload?.actorRoleCode)
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

  ipcMain.handle(
    'products:image:save',
    async (
      _event,
      args?: {
        payload?: { dataUrl?: string; previousPhoto?: string | null }
        actorRoleCode?: string
      },
    ) => {
      try {
        ensureAdmin(args?.actorRoleCode)
        const dataUrl = args?.payload?.dataUrl
        if (!dataUrl) {
          return { ok: false, message: 'Image data is required' }
        }

        const { buffer, ext } = parseImageDataUrl(dataUrl)
        const imagesDir = getImagesDirectoryPath()
        await fs.mkdir(imagesDir, { recursive: true })

        const fileName = `product-${Date.now()}-${crypto.randomUUID()}.${ext}`
        await fs.writeFile(path.join(imagesDir, fileName), buffer)

        const previousPhoto = args?.payload?.previousPhoto?.trim()
        if (previousPhoto && previousPhoto !== 'picture.png') {
          const previousPath = path.join(imagesDir, path.basename(previousPhoto))
          await fs.rm(previousPath, { force: true })
        }

        return { ok: true, photo: fileName }
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Failed to save image',
        }
      }
    },
  )
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
