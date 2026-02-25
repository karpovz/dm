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
  getProduct: (article: string) =>
    ipcRenderer.invoke('products:get', { article }) as Promise<{
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
  createProduct: (
    product: {
    article?: string
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
    actorRoleCode?: string,
  ) =>
    ipcRenderer.invoke('products:create', { product, actorRoleCode }) as Promise<{
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
      article?: string
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
    actorRoleCode?: string,
  ) =>
    ipcRenderer.invoke('products:update', { article, product, actorRoleCode }) as Promise<{
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
  deleteProduct: (article: string, actorRoleCode?: string) =>
    ipcRenderer.invoke('products:delete', { article, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
    }>,
  saveProductImage: (payload: { dataUrl: string; previousPhoto?: string | null }, actorRoleCode?: string) =>
    ipcRenderer.invoke('products:image:save', { payload, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
      photo?: string
    }>,
  listOrders: (
    options?: {
      page?: number
      pageSize?: number
      search?: string
      status?: string
      pickupPointId?: number
      userId?: number
      sortBy?: 'id' | 'orderDate' | 'deliveryDate' | 'status'
      sortDir?: 'asc' | 'desc'
    },
    actorRoleCode?: string,
  ) =>
    ipcRenderer.invoke('orders:list', { options: options ?? {}, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
      items?: Array<{
        id: number
        orderDate: string
        deliveryDate: string
        pickupPointId: number
        pickupPointLabel: string
        userId: number
        userFullName: string
        pickupCode: string
        status: string
      }>
      total?: number
      page?: number
      pageSize?: number
      lookups?: {
        statuses: string[]
        pickupPoints: Array<{ id: number; label: string }>
        users: Array<{ id: number; fullName: string }>
      }
    }>,
  getOrder: (id: number, actorRoleCode?: string) =>
    ipcRenderer.invoke('orders:get', { id, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
      item?: {
        id: number
        orderDate: string
        deliveryDate: string
        pickupPointId: number
        pickupPointLabel: string
        userId: number
        userFullName: string
        pickupCode: string
        status: string
      }
    }>,
  createOrder: (
    order: {
      orderDate: string
      deliveryDate: string
      pickupPointId: number
      userId: number
      pickupCode: string
      status: string
    },
    actorRoleCode?: string,
  ) =>
    ipcRenderer.invoke('orders:create', { order, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
      item?: {
        id: number
        orderDate: string
        deliveryDate: string
        pickupPointId: number
        pickupPointLabel: string
        userId: number
        userFullName: string
        pickupCode: string
        status: string
      }
    }>,
  updateOrder: (
    id: number,
    order: {
      orderDate: string
      deliveryDate: string
      pickupPointId: number
      userId: number
      pickupCode: string
      status: string
    },
    actorRoleCode?: string,
  ) =>
    ipcRenderer.invoke('orders:update', { id, order, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
      item?: {
        id: number
        orderDate: string
        deliveryDate: string
        pickupPointId: number
        pickupPointLabel: string
        userId: number
        userFullName: string
        pickupCode: string
        status: string
      }
    }>,
  deleteOrder: (id: number, actorRoleCode?: string) =>
    ipcRenderer.invoke('orders:delete', { id, actorRoleCode }) as Promise<{
      ok: boolean
      message?: string
    }>,
}

contextBridge.exposeInMainWorld('api', api)
