import { Pool, type PoolClient } from 'pg'

let pool: Pool | null = null

export type AuthUser = {
  id: number
  fullName: string
  login: string
  role: {
    code: string
    name: string
  }
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

export type ProductListOptions = {
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

export type ProductLookupItem = {
  id: number
  name: string
}

export type ProductDto = {
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

export type ProductListItem = {
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

export type ProductListResult = {
  items: ProductListItem[]
  total: number
  page: number
  pageSize: number
  lookups: {
    categories: ProductLookupItem[]
    suppliers: ProductLookupItem[]
    manufacturers: ProductLookupItem[]
  }
}

export type OrderSortBy = 'id' | 'orderDate' | 'deliveryDate' | 'status'

export type OrderSortDir = 'asc' | 'desc'

export type OrderListOptions = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  pickupPointId?: number
  userId?: number
  sortBy?: OrderSortBy
  sortDir?: OrderSortDir
}

export type PickupPointLookupItem = {
  id: number
  label: string
}

export type UserLookupItem = {
  id: number
  fullName: string
}

export type OrderDto = {
  orderDate: string
  deliveryDate: string
  pickupPointId: number
  userId: number
  pickupCode: string
  status: string
}

export type OrderListItem = {
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

export type OrderListResult = {
  items: OrderListItem[]
  total: number
  page: number
  pageSize: number
  lookups: {
    statuses: string[]
    pickupPoints: PickupPointLookupItem[]
    users: UserLookupItem[]
  }
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getPool(): Pool {
  if (pool) return pool

  pool = new Pool({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: toNumber(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE ?? 'postgres',
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    max: toNumber(process.env.PGPOOL_MAX, 10),
    idleTimeoutMillis: toNumber(process.env.PG_IDLE_TIMEOUT_MS, 10000),
    connectionTimeoutMillis: toNumber(process.env.PG_CONNECT_TIMEOUT_MS, 5000),
  })

  return pool
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }
  const rounded = Math.trunc(value)
  return Math.min(max, Math.max(min, rounded))
}

function toNullableTrimmed(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function mapSortColumn(sortBy: ProductSortBy | undefined): string {
  switch (sortBy) {
    case 'price':
      return 'p.price'
    case 'discountPercent':
      return 'p.discount_percent'
    case 'stockQty':
      return 'p.stock_qty'
    case 'categoryName':
      return 'pc.name'
    case 'supplierName':
      return 's.name'
    case 'manufacturerName':
      return 'm.name'
    case 'name':
    default:
      return 'p.name'
  }
}

function mapOrderSortColumn(sortBy: OrderSortBy | undefined): string {
  switch (sortBy) {
    case 'orderDate':
      return 'o.order_date'
    case 'deliveryDate':
      return 'o.delivery_date'
    case 'status':
      return 'o.status'
    case 'id':
    default:
      return 'o.id'
  }
}

function normalizeDateInput(value: string, fieldName: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`Поле "${fieldName}" обязательно`)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Поле "${fieldName}" должно содержать корректную дату`)
  }
  return parsed.toISOString().slice(0, 10)
}

function sanitizeOrderInput(payload: OrderDto): OrderDto {
  const orderDate = normalizeDateInput(payload.orderDate, 'Дата заказа')
  const deliveryDate = normalizeDateInput(payload.deliveryDate, 'Дата выдачи')
  const pickupPointId = Number(payload.pickupPointId)
  const userId = Number(payload.userId)
  const pickupCode = payload.pickupCode.trim()
  const status = payload.status.trim()

  if (!Number.isInteger(pickupPointId) || pickupPointId <= 0) {
    throw new Error('Пункт выдачи обязателен')
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Клиент обязателен')
  }
  if (!pickupCode) {
    throw new Error('Код выдачи обязателен')
  }
  if (!status) {
    throw new Error('Статус заказа обязателен')
  }
  if (deliveryDate < orderDate) {
    throw new Error('Дата выдачи не может быть раньше даты заказа')
  }

  return {
    orderDate,
    deliveryDate,
    pickupPointId,
    userId,
    pickupCode,
    status,
  }
}

function mapOrderRow(row: {
  id: number
  order_date: string
  delivery_date: string
  pickup_point_id: number
  pickup_point_label: string
  user_id: number
  user_full_name: string
  pickup_code: string
  status: string
}): OrderListItem {
  return {
    id: row.id,
    orderDate: row.order_date,
    deliveryDate: row.delivery_date,
    pickupPointId: row.pickup_point_id,
    pickupPointLabel: row.pickup_point_label,
    userId: row.user_id,
    userFullName: row.user_full_name,
    pickupCode: row.pickup_code,
    status: row.status,
  }
}

async function getOrderLookups(client: PoolClient) {
  const [statusResult, pickupPointResult, usersResult] = await Promise.all([
    client.query<{ status: string }>(
      `SELECT DISTINCT status
       FROM orders
       WHERE TRIM(status) <> ''
       ORDER BY status`,
    ),
    client.query<{ id: number; label: string }>(
      `SELECT id,
              CONCAT(postal_code, ', ', city, ', ', street, COALESCE(', ' || NULLIF(house, ''), '')) AS label
       FROM pickup_points
       ORDER BY id`,
    ),
    client.query<{ id: number; full_name: string }>(
      `SELECT id, full_name
       FROM users
       ORDER BY full_name`,
    ),
  ])

  const statuses = statusResult.rows.map((row) => row.status)
  if (!statuses.includes('Новый')) statuses.unshift('Новый')
  if (!statuses.includes('Завершен')) statuses.push('Завершен')

  return {
    statuses,
    pickupPoints: pickupPointResult.rows.map((row) => ({ id: row.id, label: row.label })),
    users: usersResult.rows.map((row) => ({ id: row.id, fullName: row.full_name })),
  }
}

async function getProductLookups() {
  const client = await getPool().connect()
  try {
    const [categories, suppliers, manufacturers] = await Promise.all([
      client.query<ProductLookupItem>('SELECT id, name FROM product_categories ORDER BY name'),
      client.query<ProductLookupItem>('SELECT id, name FROM suppliers ORDER BY name'),
      client.query<ProductLookupItem>('SELECT id, name FROM manufacturers ORDER BY name'),
    ])

    return {
      categories: categories.rows,
      suppliers: suppliers.rows,
      manufacturers: manufacturers.rows,
    }
  } finally {
    client.release()
  }
}

export async function getProductByArticle(article: string): Promise<ProductListItem | null> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{
      article: string
      name: string
      unit: string
      price: string
      discounted_price: string
      supplier_id: number
      supplier_name: string
      manufacturer_id: number
      manufacturer_name: string
      category_id: number
      category_name: string
      discount_percent: number
      stock_qty: number
      description: string | null
      photo: string | null
    }>(
      `SELECT p.article,
              p.name,
              p.unit,
              p.price::text AS price,
              ROUND(p.price * (1 - p.discount_percent / 100.0), 2)::text AS discounted_price,
              p.supplier_id,
              s.name AS supplier_name,
              p.manufacturer_id,
              m.name AS manufacturer_name,
              p.category_id,
              pc.name AS category_name,
              p.discount_percent,
              p.stock_qty,
              p.description,
              p.photo
       FROM products p
       INNER JOIN suppliers s ON s.id = p.supplier_id
       INNER JOIN manufacturers m ON m.id = p.manufacturer_id
       INNER JOIN product_categories pc ON pc.id = p.category_id
       WHERE p.article = $1
       LIMIT 1`,
      [article],
    )

    const row = result.rows[0]
    if (!row) {
      return null
    }

    return {
      article: row.article,
      name: row.name,
      unit: row.unit,
      price: Number(row.price),
      discountedPrice: Number(row.discounted_price),
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      manufacturerId: row.manufacturer_id,
      manufacturerName: row.manufacturer_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      discountPercent: row.discount_percent,
      stockQty: row.stock_qty,
      description: row.description,
      photo: row.photo,
    }
  } finally {
    client.release()
  }
}

export async function checkDbHealth(): Promise<{ ok: boolean; now: string }> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{ now: string }>('SELECT NOW()::text AS now')
    return { ok: true, now: result.rows[0]?.now ?? '' }
  } finally {
    client.release()
  }
}

export async function listPublicTables(): Promise<{ table_name: string }[]> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name
       LIMIT 50`,
    )
    return result.rows
  } finally {
    client.release()
  }
}

export async function findAuthUser(login: string, password: string): Promise<AuthUser | null> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{
      id: number
      full_name: string
      login: string
      role_code: string
      role_name: string
    }>(
      `SELECT u.id,
              u.full_name,
              u.login,
              r.code AS role_code,
              r.name AS role_name
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.login = $1
         AND u.password_plain = $2
       LIMIT 1`,
      [login, password],
    )

    const row = result.rows[0]
    if (!row) {
      return null
    }

    return {
      id: row.id,
      fullName: row.full_name,
      login: row.login,
      role: {
        code: row.role_code,
        name: row.role_name,
      },
    }
  } finally {
    client.release()
  }
}

export async function listProducts(options: ProductListOptions = {}): Promise<ProductListResult> {
  const page = clampInteger(options.page, 1, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = clampInteger(options.pageSize, 10, 1, 100)
  const sortColumn = mapSortColumn(options.sortBy)
  const sortDirection = options.sortDir === 'desc' ? 'DESC' : 'ASC'
  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const values: Array<string | number | boolean> = []

  const search = toNullableTrimmed(options.search)
  if (search) {
    values.push(`%${search}%`)
    const param = `$${values.length}`
    conditions.push(
      `(p.article ILIKE ${param} OR p.name ILIKE ${param} OR p.unit ILIKE ${param} OR COALESCE(p.description, '') ILIKE ${param} OR s.name ILIKE ${param} OR m.name ILIKE ${param} OR pc.name ILIKE ${param})`,
    )
  }

  const categoryId = toOptionalNumber(options.categoryId)
  if (typeof categoryId === 'number') {
    values.push(categoryId)
    conditions.push(`p.category_id = $${values.length}`)
  }

  const supplierId = toOptionalNumber(options.supplierId)
  if (typeof supplierId === 'number') {
    values.push(supplierId)
    conditions.push(`p.supplier_id = $${values.length}`)
  }

  const manufacturerId = toOptionalNumber(options.manufacturerId)
  if (typeof manufacturerId === 'number') {
    values.push(manufacturerId)
    conditions.push(`p.manufacturer_id = $${values.length}`)
  }

  if (options.inStockOnly) {
    conditions.push('p.stock_qty > 0')
  }

  if (typeof options.discountFrom === 'number') {
    values.push(options.discountFrom)
    conditions.push(`p.discount_percent >= $${values.length}`)
  }

  if (typeof options.discountTo === 'number') {
    values.push(options.discountTo)
    conditions.push(`p.discount_percent <= $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const dataSql = `SELECT p.article,
                          p.name,
                          p.unit,
                          p.price::text AS price,
                          ROUND(p.price * (1 - p.discount_percent / 100.0), 2)::text AS discounted_price,
                          p.supplier_id,
                          s.name AS supplier_name,
                          p.manufacturer_id,
                          m.name AS manufacturer_name,
                          p.category_id,
                          pc.name AS category_name,
                          p.discount_percent,
                          p.stock_qty,
                          p.description,
                          p.photo
                   FROM products p
                   INNER JOIN suppliers s ON s.id = p.supplier_id
                   INNER JOIN manufacturers m ON m.id = p.manufacturer_id
                   INNER JOIN product_categories pc ON pc.id = p.category_id
                   ${whereClause}
                   ORDER BY ${sortColumn} ${sortDirection}, p.article ASC
                   LIMIT $${values.length + 1}
                   OFFSET $${values.length + 2}`

  const countSql = `SELECT COUNT(*)::int AS total
                    FROM products p
                    INNER JOIN suppliers s ON s.id = p.supplier_id
                    INNER JOIN manufacturers m ON m.id = p.manufacturer_id
                    INNER JOIN product_categories pc ON pc.id = p.category_id
                    ${whereClause}`

  const client = await getPool().connect()
  try {
    const [rowsResult, countResult, lookups] = await Promise.all([
      client.query<{
        article: string
        name: string
        unit: string
        price: string
        discounted_price: string
        supplier_id: number
        supplier_name: string
        manufacturer_id: number
        manufacturer_name: string
        category_id: number
        category_name: string
        discount_percent: number
        stock_qty: number
        description: string | null
        photo: string | null
      }>(dataSql, [...values, pageSize, offset]),
      client.query<{ total: number }>(countSql, values),
      getProductLookups(),
    ])

    return {
      items: rowsResult.rows.map((row) => ({
        article: row.article,
        name: row.name,
        unit: row.unit,
        price: Number(row.price),
        discountedPrice: Number(row.discounted_price),
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        manufacturerId: row.manufacturer_id,
        manufacturerName: row.manufacturer_name,
        categoryId: row.category_id,
        categoryName: row.category_name,
        discountPercent: row.discount_percent,
        stockQty: row.stock_qty,
        description: row.description,
        photo: row.photo,
      })),
      total: countResult.rows[0]?.total ?? 0,
      page,
      pageSize,
      lookups,
    }
  } finally {
    client.release()
  }
}

async function generateNextArticle(client: Pool | PoolClient): Promise<string> {
  // We derive next numeric ID from any digits in existing article values to satisfy "ID +1".
  const result = await client.query<{ max_id: number }>(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(article, '\\D', '', 'g'), '')::int), 0) AS max_id
     FROM products`,
  )
  const nextValue = (result.rows[0]?.max_id ?? 0) + 1
  return `AUTO-${nextValue}`
}

function sanitizeProductInput(payload: ProductDto, articleOverride?: string): ProductDto {
  const article = (articleOverride ?? payload.article ?? '').trim()
  const name = payload.name.trim()
  const unit = payload.unit.trim()
  const price = Number(payload.price)
  const supplierId = Number(payload.supplierId)
  const manufacturerId = Number(payload.manufacturerId)
  const categoryId = Number(payload.categoryId)
  const discountPercent = clampInteger(Number(payload.discountPercent), 0, 0, 100)
  const stockQty = clampInteger(Number(payload.stockQty), 0, 0, Number.MAX_SAFE_INTEGER)
  const description = toNullableTrimmed(payload.description)
  const photo = toNullableTrimmed(payload.photo)

  if (!article) throw new Error('Article is required')
  if (!name) throw new Error('Product name is required')
  if (!unit) throw new Error('Unit is required')
  if (!Number.isFinite(price) || price < 0) throw new Error('Price must be a non-negative number')
  if (!Number.isInteger(supplierId) || supplierId <= 0) throw new Error('Supplier is required')
  if (!Number.isInteger(manufacturerId) || manufacturerId <= 0) throw new Error('Manufacturer is required')
  if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('Category is required')

  return {
    article,
    name,
    unit,
    price,
    supplierId,
    manufacturerId,
    categoryId,
    discountPercent,
    stockQty,
    description,
    photo,
  }
}

export async function createProduct(payload: ProductDto): Promise<ProductListItem> {
  const client = await getPool().connect()
  try {
    const generatedArticle = payload.article?.trim() ? undefined : await generateNextArticle(client)
    const product = sanitizeProductInput(payload, generatedArticle)
    await client.query(
      `INSERT INTO products (
          article, name, unit, price, supplier_id, manufacturer_id, category_id,
          discount_percent, stock_qty, description, photo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        product.article,
        product.name,
        product.unit,
        product.price,
        product.supplierId,
        product.manufacturerId,
        product.categoryId,
        product.discountPercent,
        product.stockQty,
        product.description,
        product.photo,
      ],
    )
    const created = await getProductByArticle(product.article)
    if (!created) {
      throw new Error('Product was created but could not be loaded')
    }
    return created
  } finally {
    client.release()
  }
}

export async function updateProduct(article: string, payload: ProductDto): Promise<ProductListItem | null> {
  const product = sanitizeProductInput(payload, article)
  const client = await getPool().connect()
  try {
    const result = await client.query(
      `UPDATE products
       SET name = $2,
           unit = $3,
           price = $4,
           supplier_id = $5,
           manufacturer_id = $6,
           category_id = $7,
           discount_percent = $8,
           stock_qty = $9,
           description = $10,
           photo = $11
       WHERE article = $1`,
      [
        product.article,
        product.name,
        product.unit,
        product.price,
        product.supplierId,
        product.manufacturerId,
        product.categoryId,
        product.discountPercent,
        product.stockQty,
        product.description,
        product.photo,
      ],
    )

    if (result.rowCount === 0) {
      return null
    }
  } finally {
    client.release()
  }

  return getProductByArticle(product.article)
}

export async function deleteProduct(article: string): Promise<boolean> {
  const client = await getPool().connect()
  try {
    const result = await client.query('DELETE FROM products WHERE article = $1', [article])
    return (result.rowCount ?? 0) > 0
  } finally {
    client.release()
  }
}

export async function getOrderById(id: number): Promise<OrderListItem | null> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{
      id: number
      order_date: string
      delivery_date: string
      pickup_point_id: number
      pickup_point_label: string
      user_id: number
      user_full_name: string
      pickup_code: string
      status: string
    }>(
      `SELECT o.id,
              o.order_date::text AS order_date,
              o.delivery_date::text AS delivery_date,
              o.pickup_point_id,
              CONCAT(pp.postal_code, ', ', pp.city, ', ', pp.street, COALESCE(', ' || NULLIF(pp.house, ''), '')) AS pickup_point_label,
              o.user_id,
              u.full_name AS user_full_name,
              o.pickup_code,
              o.status
       FROM orders o
       INNER JOIN pickup_points pp ON pp.id = o.pickup_point_id
       INNER JOIN users u ON u.id = o.user_id
       WHERE o.id = $1
       LIMIT 1`,
      [id],
    )

    const row = result.rows[0]
    return row ? mapOrderRow(row) : null
  } finally {
    client.release()
  }
}

export async function listOrders(options: OrderListOptions = {}): Promise<OrderListResult> {
  const page = clampInteger(options.page, 1, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = clampInteger(options.pageSize, 10, 1, 100)
  const sortColumn = mapOrderSortColumn(options.sortBy)
  const sortDirection = options.sortDir === 'desc' ? 'DESC' : 'ASC'
  const offset = (page - 1) * pageSize

  const values: Array<string | number> = []
  const conditions: string[] = []
  const search = toNullableTrimmed(options.search)
  if (search) {
    values.push(`%${search}%`)
    const param = `$${values.length}`
    conditions.push(
      `(o.id::text ILIKE ${param}
        OR o.pickup_code ILIKE ${param}
        OR o.status ILIKE ${param}
        OR u.full_name ILIKE ${param}
        OR pp.city ILIKE ${param}
        OR pp.street ILIKE ${param})`,
    )
  }

  const status = toNullableTrimmed(options.status)
  if (status) {
    values.push(status)
    conditions.push(`o.status = $${values.length}`)
  }

  const pickupPointId = toOptionalNumber(options.pickupPointId)
  if (typeof pickupPointId === 'number') {
    values.push(pickupPointId)
    conditions.push(`o.pickup_point_id = $${values.length}`)
  }

  const userId = toOptionalNumber(options.userId)
  if (typeof userId === 'number') {
    values.push(userId)
    conditions.push(`o.user_id = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const dataSql = `SELECT o.id,
                          o.order_date::text AS order_date,
                          o.delivery_date::text AS delivery_date,
                          o.pickup_point_id,
                          CONCAT(pp.postal_code, ', ', pp.city, ', ', pp.street, COALESCE(', ' || NULLIF(pp.house, ''), '')) AS pickup_point_label,
                          o.user_id,
                          u.full_name AS user_full_name,
                          o.pickup_code,
                          o.status
                   FROM orders o
                   INNER JOIN pickup_points pp ON pp.id = o.pickup_point_id
                   INNER JOIN users u ON u.id = o.user_id
                   ${whereClause}
                   ORDER BY ${sortColumn} ${sortDirection}, o.id ASC
                   LIMIT $${values.length + 1}
                   OFFSET $${values.length + 2}`

  const countSql = `SELECT COUNT(*)::int AS total
                    FROM orders o
                    INNER JOIN pickup_points pp ON pp.id = o.pickup_point_id
                    INNER JOIN users u ON u.id = o.user_id
                    ${whereClause}`

  const client = await getPool().connect()
  try {
    const [rowsResult, countResult, lookups] = await Promise.all([
      client.query<{
        id: number
        order_date: string
        delivery_date: string
        pickup_point_id: number
        pickup_point_label: string
        user_id: number
        user_full_name: string
        pickup_code: string
        status: string
      }>(dataSql, [...values, pageSize, offset]),
      client.query<{ total: number }>(countSql, values),
      getOrderLookups(client),
    ])

    return {
      items: rowsResult.rows.map((row) => mapOrderRow(row)),
      total: countResult.rows[0]?.total ?? 0,
      page,
      pageSize,
      lookups,
    }
  } finally {
    client.release()
  }
}

async function generateNextOrderId(client: PoolClient): Promise<number> {
  const result = await client.query<{ max_id: number }>('SELECT COALESCE(MAX(id), 0) AS max_id FROM orders')
  return (result.rows[0]?.max_id ?? 0) + 1
}

export async function createOrder(payload: OrderDto): Promise<OrderListItem> {
  const order = sanitizeOrderInput(payload)
  const client = await getPool().connect()
  try {
    const id = await generateNextOrderId(client)
    await client.query(
      `INSERT INTO orders (id, order_date, delivery_date, pickup_point_id, user_id, pickup_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, order.orderDate, order.deliveryDate, order.pickupPointId, order.userId, order.pickupCode, order.status],
    )
    const created = await getOrderById(id)
    if (!created) {
      throw new Error('Заказ создан, но не найден при повторном чтении')
    }
    return created
  } finally {
    client.release()
  }
}

export async function updateOrder(id: number, payload: OrderDto): Promise<OrderListItem | null> {
  const order = sanitizeOrderInput(payload)
  const client = await getPool().connect()
  try {
    const result = await client.query(
      `UPDATE orders
       SET order_date = $2,
           delivery_date = $3,
           pickup_point_id = $4,
           user_id = $5,
           pickup_code = $6,
           status = $7
       WHERE id = $1`,
      [id, order.orderDate, order.deliveryDate, order.pickupPointId, order.userId, order.pickupCode, order.status],
    )

    if (result.rowCount === 0) {
      return null
    }
  } finally {
    client.release()
  }

  return getOrderById(id)
}

export async function deleteOrder(id: number): Promise<boolean> {
  const client = await getPool().connect()
  try {
    const result = await client.query('DELETE FROM orders WHERE id = $1', [id])
    return (result.rowCount ?? 0) > 0
  } finally {
    client.release()
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return
  await pool.end()
  pool = null
}
