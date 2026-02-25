import { contextBridge, ipcRenderer } from 'electron'

const api = {
  checkHealth: () => ipcRenderer.invoke('health:check') as Promise<{
    ok: boolean
    message?: string
    db?: { ok: boolean; now: string }
  }>,
  listTables: () => ipcRenderer.invoke('db:tables') as Promise<{
    ok: boolean
    message?: string
    tables?: { table_name: string }[]
  }>,
  login: (login: string, password: string) =>
    ipcRenderer.invoke('auth:login', { login, password }) as Promise<{
      ok: boolean
      message?: string
      user?: {
        id: number
        fullName: string
        login: string
        role: { code: string; name: string }
      }
    }>,
  listProducts: (options?: {
    page?: number
    pageSize?: number
    search?: string
    categoryId?: number
    supplierId?: number
    manufacturerId?: number
    inStockOnly?: boolean
    discountFrom?: number
    discountTo?: number
    sortBy?:
      | 'name'
      | 'price'
      | 'discountPercent'
      | 'stockQty'
      | 'categoryName'
      | 'supplierName'
      | 'manufacturerName'
    sortDir?: 'asc' | 'desc'
  }) =>
    ipcRenderer.invoke('products:list', options ?? {}) as Promise<{
      ok: boolean
      message?: string
      items?: Array<{
        article: string
        name: string
        unit: string
        price: number
        discountedPrice: number
        supplierId: number
        supplierName: string
        manufacturerId: number
        manufacturerName: string
        categoryId: number
        categoryName: string
        discountPercent: number
        stockQty: number
        description: string | null
        photo: string | null
      }>
      total?: number
      page?: number
      pageSize?: number
      lookups?: {
        categories: Array<{ id: number; name: string }>
        suppliers: Array<{ id: number; name: string }>
        manufacturers: Array<{ id: number; name: string }>
      }
    }>,
  createProduct: (product: {
    article: string
    name: string
    unit: string
    price: number
    supplierId: number
    manufacturerId: number
    categoryId: number
    discountPercent: number
    stockQty: number
    description: string | null
    photo: string | null
  }) =>
    ipcRenderer.invoke('products:create', product) as Promise<{
      ok: boolean
      message?: string
      item?: {
        article: string
        name: string
        unit: string
        price: number
        discountedPrice: number
        supplierId: number
        supplierName: string
        manufacturerId: number
        manufacturerName: string
        categoryId: number
        categoryName: string
        discountPercent: number
        stockQty: number
        description: string | null
        photo: string | null
      }
    }>,
  updateProduct: (
    article: string,
    product: {
      article: string
      name: string
      unit: string
      price: number
      supplierId: number
      manufacturerId: number
      categoryId: number
      discountPercent: number
      stockQty: number
      description: string | null
      photo: string | null
    },
  ) =>
    ipcRenderer.invoke('products:update', { article, product }) as Promise<{
      ok: boolean
      message?: string
      item?: {
        article: string
        name: string
        unit: string
        price: number
        discountedPrice: number
        supplierId: number
        supplierName: string
        manufacturerId: number
        manufacturerName: string
        categoryId: number
        categoryName: string
        discountPercent: number
        stockQty: number
        description: string | null
        photo: string | null
      }
    }>,
  deleteProduct: (article: string) =>
    ipcRenderer.invoke('products:delete', { article }) as Promise<{
      ok: boolean
      message?: string
    }>,
}

contextBridge.exposeInMainWorld('api', api)
