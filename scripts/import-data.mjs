import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

dotenv.config()

const roleCodeBySourceName = {
  'Администратор': 'admin',
  'Менеджер': 'manager',
  'Авторизированный клиент': 'client',
}

const rolesData = [
  { code: 'admin', name: 'Админ' },
  { code: 'manager', name: 'Менеджер' },
  { code: 'client', name: 'Клиент' },
]

const usersData = [
  { role: 'Администратор', fullName: 'Никифорова Весения Николаевна', login: '94d5ous@gmail.com', password: 'uzWC67' },
  { role: 'Администратор', fullName: 'Сазонов Руслан Германович', login: 'uth4iz@mail.com', password: '2L6KZG' },
  { role: 'Администратор', fullName: 'Одинцов Серафим Артёмович', login: '5d4zbu@tutanota.com', password: 'rwVDh9' },
  { role: 'Менеджер', fullName: 'Ситдикова Елена Анатольевна', login: 'ptec8ym@yahoo.com', password: 'LdNyos' },
  { role: 'Менеджер', fullName: 'Ворсин Петр Евгеньевич', login: '1qz4kw@mail.com', password: 'gynQMT' },
  { role: 'Менеджер', fullName: 'Старикова Елена Павловна', login: '4np6se@mail.com', password: 'AtnDjr' },
  { role: 'Авторизированный клиент', fullName: 'Никифорова Анна Семеновна', login: 'yzls62@outlook.com', password: 'JlFRCZ' },
  { role: 'Авторизированный клиент', fullName: 'Стелина Евгения Петровна', login: '1diph5e@tutanota.com', password: '8ntwUp' },
  { role: 'Авторизированный клиент', fullName: 'Михайлюк Анна Вячеславовна', login: 'tjde7c@yahoo.com', password: 'YOyhfR' },
  { role: 'Авторизированный клиент', fullName: 'Степанов Михаил Артёмович', login: 'wpmrc3do@tutanota.com', password: 'RSbvHv' },
]

const productsData = [
  {
    article: 'А112Т4',
    name: 'Велосипед взрослый горный Slash Stream 27.5 колеса (2025) 17" Черный (162-172 см)',
    unit: 'шт.',
    price: 19775,
    supplier: 'ВелоСтрана',
    manufacturer: 'Slash',
    category: 'Велосипед взрослый горный',
    discountPercent: 30,
    stockQty: 15,
    description:
      'Горный велосипед Slash Stream 27.5 (2025) - легкий и надежный компаньон для поездок по пересеченной местности. Мощные шатуны интенсивно передают усилия мышц на вал каретки.',
    photo: '1.jpg',
  },
  {
    article: 'G843H5',
    name: 'Велосипед взрослый горный Slash Stream 27.5 колеса (2025) 19" Синий (172-182 см)',
    unit: 'шт.',
    price: 19791,
    supplier: 'ВелоСтрана',
    manufacturer: 'Slash',
    category: 'Велосипед взрослый горный',
    discountPercent: 30,
    stockQty: 9,
    description:
      'В комплектацию включены дисковые механические тормоза RPT DSC-310. Особый упор разработчики рамы данной модели сделали на увеличение прочности мест наибольшей нагрузки.',
    photo: '2.jpg',
  },
  {
    article: 'D325D4',
    name: 'Велосипед городской подростковый серый',
    unit: 'шт.',
    price: 9919,
    supplier: 'ЯндексМаркет',
    manufacturer: 'Shimano',
    category: 'Велосипед городской подростковый',
    discountPercent: 5,
    stockQty: 12,
    description:
      'Городской подростковый велосипед - идеальный выбор для активного образа жизни! Откройте для себя комфорт и свободу передвижения с нашим стильным городским велосипедом.',
    photo: '3.jpg',
  },
  {
    article: 'S432T5',
    name: 'Велосипед Skill Bike 3051, городской, 21 скорость, сталь, 29" колеса, черно-красный',
    unit: 'шт.',
    price: 16442,
    supplier: 'Скилс',
    manufacturer: 'Skill bike',
    category: 'Велосипед городской взрослый',
    discountPercent: 15,
    stockQty: 15,
    description:
      'SKILL BIKE модель 3051 - горный велосипед на спицах, обеспечивающий уверенную и комфортную езду как по городским улицам, так и по горной местности.',
    photo: '4.jpg',
  },
  {
    article: 'F325D4',
    name: 'Велосипед Skillbike 3052, горный, складной, рама 17 дюймов, колеса 26 дюймов, 21 скорость',
    unit: 'шт.',
    price: 17985,
    supplier: 'Скилс',
    manufacturer: 'Skill bike',
    category: 'Велосипед взрослый горный',
    discountPercent: 18,
    stockQty: 50,
    description:
      'SKILL BIKE модель 3052 - велосипед складной, предназначен для тех, кто ценит комфорт, стиль и максимальную мобильность. Горный велосипед легко помещается в багажник и идеально подходит для активных поездок в городской суете.',
    photo: '5.jpg',
  },
  {
    article: 'G432G6',
    name: 'Велосипед Skill Bike 3053, горный, двухподвесный, рама 17 дюймов, колеса 26 дюймов, 21 скорость',
    unit: 'шт.',
    price: 17621,
    supplier: 'Скилс',
    manufacturer: 'Skill bike',
    category: 'Велосипед взрослый горный',
    discountPercent: 20,
    stockQty: 0,
    description:
      'SKILL BIKE модель 3053 - горный велосипед на литых дисках, имеет амортизаторы как на переднем, так и на заднем колесе.',
    photo: '6.jpg',
  },
  {
    article: 'H542F5',
    name: 'Велосипед MILANO M300, горный, для взрослых, 26", 7 скоростей',
    unit: 'шт.',
    price: 13509,
    supplier: 'ПерспективаГрупп',
    manufacturer: 'NEXT',
    category: 'Велосипед взрослый горный',
    discountPercent: 4,
    stockQty: 5,
    description:
      'Горный велосипед MILANO M300 с диаметром колес 26 дюйма подойдет для подростков и взрослых, без усилий позволит преодолевать любые непроходимые каменистые поверхности и зоны бездорожья.',
    photo: '7.jpg',
  },
  {
    article: 'C346F5',
    name: 'Горный велосипед скоростной, колеса 24", рама - 14", черно-красный',
    unit: 'шт.',
    price: 15212,
    supplier: 'ПерспективаГрупп',
    manufacturer: 'Aero',
    category: 'Велосипед детский горный',
    discountPercent: 5,
    stockQty: 4,
    description:
      'Горный велосипед - это надежный и стильный выбор для любителей активного отдыха. Удобное седло из искусственной кожи и наличие подножки добавляют удобства во время поездок.',
    photo: '8.jpg',
  },
  {
    article: 'F256G6',
    name: '26" Велосипед Fizard, 15" алюминий, дисковые тормоза, 21 скорость, серый',
    unit: 'шт.',
    price: 15126,
    supplier: 'ПерспективаГрупп',
    manufacturer: 'Fizard',
    category: 'Велосипед детский горный',
    discountPercent: 25,
    stockQty: 3,
    description: 'Горный велосипед Fizard - надежный универсальный маунтинбайк для города и бездорожья.',
    photo: '9.jpg',
  },
  {
    article: 'J532V5',
    name: 'Велосипед двухколесный детский 14 дюймов, со светящимися колесами, черный',
    unit: 'шт.',
    price: 6417,
    supplier: 'kari',
    manufacturer: 'kari',
    category: 'Велосипед детский городской',
    discountPercent: 8,
    stockQty: 6,
    description:
      'Велосипед двухколесный детский 14 дюймов от Kari - это надежный и безопасный транспорт для вашего ребенка.',
    photo: null,
  },
]

const pickupPointAddresses = [
  '420151, г. Лесной, ул. Вишневая, 32',
  '125061, г. Лесной, ул. Подгорная, 8',
  '630370, г. Лесной, ул. Шоссейная, 24',
  '400562, г. Лесной, ул. Зеленая, 32',
  '614510, г. Лесной, ул. Маяковского, 47',
  '410542, г. Лесной, ул. Светлая, 46',
  '620839, г. Лесной, ул. Цветочная, 8',
  '443890, г. Лесной, ул. Коммунистическая, 1',
  '603379, г. Лесной, ул. Спортивная, 46',
  '603721, г. Лесной, ул. Гоголя, 41',
  '410172, г. Лесной, ул. Северная, 13',
  '614611, г. Лесной, ул. Молодежная, 50',
  '454311, г.Лесной, ул. Новая, 19',
  '660007, г.Лесной, ул. Октябрьская, 19',
  '603036, г. Лесной, ул. Садовая, 4',
  '394060, г.Лесной, ул. Фрунзе, 43',
  '410661, г. Лесной, ул. Школьная, 50',
  '625590, г. Лесной, ул. Коммунистическая, 20',
  '625683, г. Лесной, ул. 8 Марта',
  '450983, г.Лесной, ул. Комсомольская, 26',
  '394782, г. Лесной, ул. Чехова, 3',
  '603002, г. Лесной, ул. Дзержинского, 28',
  '450558, г. Лесной, ул. Набережная, 30',
  '344288, г. Лесной, ул. Чехова, 1',
  '614164, г.Лесной, ул. Степная, 30',
  '394242, г. Лесной, ул. Коммунистическая, 43',
  '660540, г. Лесной, ул. Солнечная, 25',
  '125837, г. Лесной, ул. Шоссейная, 40',
  '125703, г. Лесной, ул. Партизанская, 49',
  '625283, г. Лесной, ул. Победы, 46',
  '614753, г. Лесной, ул. Полевая, 35',
  '426030, г. Лесной, ул. Маяковского, 44',
  '450375, г. Лесной ул. Клубная, 44',
  '625560, г. Лесной, ул. Некрасова, 12',
  '630201, г. Лесной, ул. Комсомольская, 17',
  '190949, г. Лесной, ул. Мичурина, 26',
]

const ordersData = [
  {
    id: 1,
    items: 'А112Т4, 2, G843H5, 2',
    orderDate: '27.02.2023',
    deliveryDate: '20.04.2023',
    pickupPointId: 1,
    clientFullName: 'Степанов Михаил Артёмович',
    pickupCode: '901',
    status: 'Новый',
  },
  {
    id: 2,
    items: 'G843H5, 1, А112Т4, 1',
    orderDate: '28.09.2022',
    deliveryDate: '21.04.2023',
    pickupPointId: 11,
    clientFullName: 'Никифорова Весения Николаевна',
    pickupCode: '902',
    status: 'Новый',
  },
  {
    id: 3,
    items: 'D325D4, 10, S432T5, 10',
    orderDate: '21.03.2023',
    deliveryDate: '22.04.2023',
    pickupPointId: 2,
    clientFullName: 'Сазонов Руслан Германович',
    pickupCode: '903',
    status: 'Новый',
  },
  {
    id: 4,
    items: 'F325D4, 5, D325D4, 4',
    orderDate: '20.02.2023',
    deliveryDate: '23.04.2023',
    pickupPointId: 11,
    clientFullName: 'Одинцов Серафим Артёмович',
    pickupCode: '904',
    status: 'Завершен',
  },
  {
    id: 5,
    items: 'G432G6, 20, H542F5, 20',
    orderDate: '17.03.2023',
    deliveryDate: '24.04.2023',
    pickupPointId: 2,
    clientFullName: 'Степанов Михаил Артёмович',
    pickupCode: '905',
    status: 'Завершен',
  },
  {
    id: 6,
    items: 'А112Т4, 2, G843H5, 2',
    orderDate: '01.03.2023',
    deliveryDate: '25.04.2023',
    pickupPointId: 15,
    clientFullName: 'Никифорова Весения Николаевна',
    pickupCode: '906',
    status: 'Завершен',
  },
  {
    id: 7,
    items: 'C346F5, 3, F256G6, 3',
    orderDate: '30.02.2023',
    deliveryDate: '26.04.2023',
    pickupPointId: 3,
    clientFullName: 'Сазонов Руслан Германович',
    pickupCode: '907',
    status: 'Завершен',
  },
  {
    id: 8,
    items: 'F325D4, 1, G432G6, 1',
    orderDate: '31.03.2023',
    deliveryDate: '27.04.2023',
    pickupPointId: 19,
    clientFullName: 'Одинцов Серафим Артёмович',
    pickupCode: '908',
    status: 'Новый',
  },
  {
    id: 9,
    items: 'J532V5, 5, F256G6, 1',
    orderDate: '02.04.2023',
    deliveryDate: '28.04.2023',
    pickupPointId: 5,
    clientFullName: 'Степанов Михаил Артёмович',
    pickupCode: '909',
    status: 'Новый',
  },
  {
    id: 10,
    items: 'F256G6, 5, J532V5, 5',
    orderDate: '03.04.2023',
    deliveryDate: '29.04.2023',
    pickupPointId: 19,
    clientFullName: 'Степанов Михаил Артёмович',
    pickupCode: '910',
    status: 'Новый',
  },
]

function toNumber(value, fallback) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeWhitespace(value) {
  return value.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeArticle(value) {
  const map = {
    А: 'A',
    В: 'B',
    Е: 'E',
    К: 'K',
    М: 'M',
    Н: 'H',
    О: 'O',
    Р: 'P',
    С: 'C',
    Т: 'T',
    Х: 'X',
    У: 'Y',
  }
  return normalizeWhitespace(value)
    .toUpperCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
}

function parseDateOrThrow(value) {
  if (value === '30.02.2023') {
    return '2023-02-28'
  }

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (!match) {
    throw new Error(`Invalid date format: ${value}`)
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const asDate = new Date(Date.UTC(year, month - 1, day))
  const sameDate =
    asDate.getUTCFullYear() === year && asDate.getUTCMonth() === month - 1 && asDate.getUTCDate() === day

  if (!sameDate) {
    throw new Error(`Invalid calendar date: ${value}`)
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseAddress(rawAddress) {
  const cleaned = normalizeWhitespace(rawAddress)
  const postalMatch = /^(\d{6})\s*,\s*(.+)$/.exec(cleaned)
  if (!postalMatch) {
    throw new Error(`Could not parse postal code in address: ${rawAddress}`)
  }

  const postalCode = postalMatch[1]
  const rest = postalMatch[2].replace(/^г\.\s*Лесной,?/i, '').replace(/^г\.Лесной,?/i, '').trim()
  const streetPart = rest.replace(/^ул\.\s*/i, '').replace(/^ул\s+/i, '')

  const commaIdx = streetPart.lastIndexOf(',')
  if (commaIdx === -1) {
    return { postalCode, city: 'Лесной', street: normalizeWhitespace(streetPart), house: null }
  }

  const street = normalizeWhitespace(streetPart.slice(0, commaIdx))
  const house = normalizeWhitespace(streetPart.slice(commaIdx + 1))

  return { postalCode, city: 'Лесной', street, house: house || null }
}

function parseOrderItems(itemsRaw) {
  const tokens = itemsRaw.split(',').map((part) => normalizeWhitespace(part))
  if (tokens.length % 2 !== 0) {
    throw new Error(`Order items should have article/qty pairs: ${itemsRaw}`)
  }

  const parsed = []
  for (let i = 0; i < tokens.length; i += 2) {
    const article = normalizeArticle(tokens[i])
    const qty = Number(tokens[i + 1])
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Invalid quantity "${tokens[i + 1]}" for article "${tokens[i]}"`)
    }
    parsed.push({ article, qty })
  }

  return parsed
}

async function ensureLookupEntries(client, tableName, names) {
  if (names.length === 0) return new Map()

  const queryByTable = {
    suppliers: 'INSERT INTO suppliers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    manufacturers: 'INSERT INTO manufacturers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    product_categories: 'INSERT INTO product_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
  }

  if (!(tableName in queryByTable)) {
    throw new Error(`Unsupported lookup table: ${tableName}`)
  }

  const uniqueNames = [...new Set(names)]
  for (const name of uniqueNames) {
    await client.query(queryByTable[tableName], [name])
  }

  const { rows } = await client.query(`SELECT id, name FROM ${tableName} WHERE name = ANY($1::text[])`, [uniqueNames])
  return new Map(rows.map((row) => [row.name, row.id]))
}

async function runImport() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const schemaPath = path.join(__dirname, 'sql', 'init-schema.sql')
  const schemaSql = await readFile(schemaPath, 'utf8')

  const pool = new Pool({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: toNumber(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE ?? 'postgres',
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    max: toNumber(process.env.PGPOOL_MAX, 10),
    idleTimeoutMillis: toNumber(process.env.PG_IDLE_TIMEOUT_MS, 10000),
    connectionTimeoutMillis: toNumber(process.env.PG_CONNECT_TIMEOUT_MS, 5000),
  })

  const client = await pool.connect()

  try {
    await client.query(schemaSql)
    await client.query('BEGIN')

    for (const role of rolesData) {
      await client.query(
        `INSERT INTO roles (code, name)
         VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
        [role.code, role.name],
      )
    }

    const roleRows = await client.query('SELECT id, code FROM roles WHERE code = ANY($1::text[])', [
      rolesData.map((r) => r.code),
    ])
    const roleIdByCode = new Map(roleRows.rows.map((row) => [row.code, row.id]))

    const userIdByFullName = new Map()
    for (const user of usersData) {
      const roleCode = roleCodeBySourceName[user.role]
      const roleId = roleIdByCode.get(roleCode)
      if (!roleId) {
        throw new Error(`Role "${roleCode}" was not found for user ${user.fullName}`)
      }

      const result = await client.query(
        `INSERT INTO users (full_name, login, password_plain, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (login) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           password_plain = EXCLUDED.password_plain,
           role_id = EXCLUDED.role_id
         RETURNING id`,
        [user.fullName, user.login, user.password, roleId],
      )
      userIdByFullName.set(user.fullName, result.rows[0].id)
    }

    const normalizedProducts = productsData.map((product) => ({
      ...product,
      article: normalizeArticle(product.article),
      unit: normalizeWhitespace(product.unit),
      supplier: normalizeWhitespace(product.supplier),
      manufacturer: normalizeWhitespace(product.manufacturer),
      category: normalizeWhitespace(product.category),
      description: product.description ? normalizeWhitespace(product.description) : null,
      photo: product.photo ? normalizeWhitespace(product.photo) : null,
    }))

    const supplierMap = await ensureLookupEntries(
      client,
      'suppliers',
      normalizedProducts.map((product) => product.supplier),
    )
    const manufacturerMap = await ensureLookupEntries(
      client,
      'manufacturers',
      normalizedProducts.map((product) => product.manufacturer),
    )
    const categoryMap = await ensureLookupEntries(
      client,
      'product_categories',
      normalizedProducts.map((product) => product.category),
    )

    for (const product of normalizedProducts) {
      const supplierId = supplierMap.get(product.supplier)
      const manufacturerId = manufacturerMap.get(product.manufacturer)
      const categoryId = categoryMap.get(product.category)

      if (!supplierId || !manufacturerId || !categoryId) {
        throw new Error(`Missing lookup id for product article ${product.article}`)
      }

      await client.query(
        `INSERT INTO products (
            article, name, unit, price, supplier_id, manufacturer_id, category_id,
            discount_percent, stock_qty, description, photo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (article) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            price = EXCLUDED.price,
            supplier_id = EXCLUDED.supplier_id,
            manufacturer_id = EXCLUDED.manufacturer_id,
            category_id = EXCLUDED.category_id,
            discount_percent = EXCLUDED.discount_percent,
            stock_qty = EXCLUDED.stock_qty,
            description = EXCLUDED.description,
            photo = EXCLUDED.photo`,
        [
          product.article,
          product.name,
          product.unit,
          product.price,
          supplierId,
          manufacturerId,
          categoryId,
          product.discountPercent,
          product.stockQty,
          product.description,
          product.photo,
        ],
      )
    }

    for (let i = 0; i < pickupPointAddresses.length; i += 1) {
      const parsed = parseAddress(pickupPointAddresses[i])
      const pickupId = i + 1
      await client.query(
        `INSERT INTO pickup_points (id, postal_code, city, street, house)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           postal_code = EXCLUDED.postal_code,
           city = EXCLUDED.city,
           street = EXCLUDED.street,
           house = EXCLUDED.house`,
        [pickupId, parsed.postalCode, parsed.city, parsed.street, parsed.house],
      )
    }

    const knownArticles = new Set(normalizedProducts.map((product) => product.article))

    for (const order of ordersData) {
      const userId = userIdByFullName.get(order.clientFullName)
      if (!userId) {
        throw new Error(`Order ${order.id}: user "${order.clientFullName}" not found`)
      }

      const items = parseOrderItems(order.items)
      for (const item of items) {
        if (!knownArticles.has(item.article)) {
          throw new Error(`Order ${order.id}: unknown article "${item.article}"`)
        }
      }

      const orderDate = parseDateOrThrow(order.orderDate)
      const deliveryDate = parseDateOrThrow(order.deliveryDate)

      await client.query(
        `INSERT INTO orders (id, order_date, delivery_date, pickup_point_id, user_id, pickup_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           order_date = EXCLUDED.order_date,
           delivery_date = EXCLUDED.delivery_date,
           pickup_point_id = EXCLUDED.pickup_point_id,
           user_id = EXCLUDED.user_id,
           pickup_code = EXCLUDED.pickup_code,
           status = EXCLUDED.status`,
        [
          order.id,
          orderDate,
          deliveryDate,
          order.pickupPointId,
          userId,
          normalizeWhitespace(order.pickupCode),
          normalizeWhitespace(order.status),
        ],
      )

      await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id])
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_article, qty)
           VALUES ($1, $2, $3)
           ON CONFLICT (order_id, product_article) DO UPDATE SET qty = EXCLUDED.qty`,
          [order.id, item.article, item.qty],
        )
      }
    }

    await client.query('COMMIT')
    console.log('Import completed successfully.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runImport().catch((error) => {
  console.error('Import failed:', error)
  process.exitCode = 1
})
