interface HealthResponse {
  ok: boolean
  message?: string
  db?: { ok: boolean; now: string }
}

interface TablesResponse {
  ok: boolean
  message?: string
  tables?: { table_name: string }[]
}

export type UserRoleCode = 'admin' | 'manager' | 'client' | 'guest'

export interface AuthUser {
  id: number
  fullName: string
  login: string
  role: {
    code: string
    name: string
  }
}

interface AuthLoginResponse {
  ok: boolean
  message?: string
  user?: AuthUser
}

export type ProductSortBy =
  | 'name'
  | 'price'
  | 'discountPercent'
  | 'stockQty'
  | 'categoryName'
  | 'supplierName'
  | 'manufacturerName'

export type ProductSortDir = 'asc' | 'desc'

export interface ProductLookupItem {
  id: number
  name: string
}

export interface ProductItem {
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

export interface ProductWritePayload {
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
}

export interface ProductImageUploadPayload {
  dataUrl: string
  previousPhoto?: string | null
}

export interface ProductListRequest {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: number
  supplierId?: number
  manufacturerId?: number
  inStockOnly?: boolean
  discountFrom?: number
  discountTo?: number
  sortBy?: ProductSortBy
  sortDir?: ProductSortDir
}

interface ProductListResponse {
  ok: boolean
  message?: string
  items?: ProductItem[]
  total?: number
  page?: number
  pageSize?: number
  lookups?: {
    categories: ProductLookupItem[]
    suppliers: ProductLookupItem[]
    manufacturers: ProductLookupItem[]
  }
}

interface ProductWriteResponse {
  ok: boolean
  message?: string
  item?: ProductItem
}

interface ProductGetResponse {
  ok: boolean
  message?: string
  item?: ProductItem
}

interface ProductDeleteResponse {
  ok: boolean
  message?: string
}

interface ProductImageUploadResponse {
  ok: boolean
  message?: string
  photo?: string
}

interface ElectronApi {
  checkHealth: () => Promise<HealthResponse>
  listTables: () => Promise<TablesResponse>
  login: (login: string, password: string) => Promise<AuthLoginResponse>
  listProducts: (options?: ProductListRequest) => Promise<ProductListResponse>
  getProduct: (article: string) => Promise<ProductGetResponse>
  createProduct: (product: ProductWritePayload, actorRoleCode?: UserRoleCode) => Promise<ProductWriteResponse>
  updateProduct: (article: string, product: ProductWritePayload, actorRoleCode?: UserRoleCode) => Promise<ProductWriteResponse>
  deleteProduct: (article: string, actorRoleCode?: UserRoleCode) => Promise<ProductDeleteResponse>
  saveProductImage: (payload: ProductImageUploadPayload, actorRoleCode?: UserRoleCode) => Promise<ProductImageUploadResponse>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
