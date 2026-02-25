import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Image,
  Input,
  Modal,
  Segmented,
  Pagination,
  Select,
  Space,
  Typography,
  message,
} from 'antd'
import { deleteProduct, listProducts } from '../api/client'
import type {
  ProductItem,
  ProductListRequest,
  ProductLookupItem,
  ProductSortBy,
  UserRoleCode,
} from '../types/electron-api'
import './ProductList.css'

type ProductListProps = {
  roleCode: UserRoleCode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  onAddProduct?: () => void
  onEditProduct?: (product: ProductItem) => void
  refreshToken?: number
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
})

const SORT_OPTIONS: Array<{ value: ProductSortBy; label: string }> = [
  { value: 'price', label: 'По цене' },
  { value: 'discountPercent', label: 'По скидке' },
  { value: 'stockQty', label: 'По остатку' },
]

type DiscountRangeValue = 'all' | '0-11.99' | '12-18.99' | '19+'

const DISCOUNT_RANGE_OPTIONS: Array<{ value: DiscountRangeValue; label: string }> = [
  { value: 'all', label: 'Все диапазоны' },
  { value: '0-11.99', label: '0-11,99%' },
  { value: '12-18.99', label: '12-18,99%' },
  { value: '19+', label: '19% и более' },
]

function mapDiscountRange(range: DiscountRangeValue): Pick<ProductListRequest, 'discountFrom' | 'discountTo'> {
  switch (range) {
    case '0-11.99':
      return { discountFrom: 0, discountTo: 11.99 }
    case '12-18.99':
      return { discountFrom: 12, discountTo: 18.99 }
    case '19+':
      return { discountFrom: 19, discountTo: undefined }
    case 'all':
    default:
      return { discountFrom: undefined, discountTo: undefined }
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function toLookupOption(item: ProductLookupItem): { value: number; label: string } | null {
  const value = toOptionalNumber(item.id)
  if (value === undefined) return null
  return { value, label: item.name }
}

function getImageSrc(photo: string | null): string {
  return photo ? `images/${photo}` : 'images/picture.png'
}

function buildImageCandidates(photo: string | null): string[] {
  if (!photo) {
    return ['images/picture.png']
  }

  const trimmed = photo.trim()
  if (!trimmed) {
    return ['images/picture.png']
  }

  const normalized = trimmed.replace(/^\/+/, '')
  const dotIdx = normalized.lastIndexOf('.')
  if (dotIdx === -1) {
    return [`images/${normalized}`, 'images/picture.png']
  }

  const name = normalized.slice(0, dotIdx)
  const ext = normalized.slice(dotIdx + 1)
  // Some source files have inconsistent extension casing, so we try all variants before fallback.
  const upperExt = ext.toUpperCase()
  const lowerExt = ext.toLowerCase()

  if (upperExt === lowerExt) {
    return [`images/${normalized}`, 'images/picture.png']
  }

  return [`images/${name}.${ext}`, `images/${name}.${upperExt}`, `images/${name}.${lowerExt}`, 'images/picture.png']
}

function getRoleName(roleCode: UserRoleCode): string {
  switch (roleCode) {
    case 'admin':
      return 'Администратор'
    case 'manager':
      return 'Менеджер'
    case 'client':
      return 'Авторизованный клиент'
    case 'guest':
    default:
      return 'Гость'
  }
}

export function ProductList({
  roleCode,
  title,
  showBackButton = false,
  onBack,
  onAddProduct,
  onEditProduct,
  refreshToken,
}: ProductListProps) {
  const [items, setItems] = useState<ProductItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductLookupItem[]>([])
  const [suppliers, setSuppliers] = useState<ProductLookupItem[]>([])
  const [manufacturers, setManufacturers] = useState<ProductLookupItem[]>([])
  const [query, setQuery] = useState<ProductListRequest>({
    page: 1,
    pageSize: 5,
    sortBy: 'price',
    sortDir: 'asc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [discountRange, setDiscountRange] = useState<DiscountRangeValue>('all')

  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imageSourceByArticle, setImageSourceByArticle] = useState<Record<string, string>>({})

  const canUseFilters = roleCode === 'manager' || roleCode === 'admin'
  const canManage = roleCode === 'admin'

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const request: ProductListRequest = canUseFilters
        ? query
        : {
            page: query.page,
            pageSize: query.pageSize,
            sortBy: 'name',
            sortDir: 'asc',
          }

      const response = await listProducts(request)
      if (!response.ok || !response.items || typeof response.total !== 'number') {
        setError(response.message ?? 'Не удалось загрузить список товаров')
        return
      }

      const loadedItems = response.items
      setItems(loadedItems)
      setTotal(response.total)
      setImageSourceByArticle((prev) => {
        const next: Record<string, string> = {}
        for (const product of loadedItems) {
          next[product.article] = prev[product.article] ?? getImageSrc(product.photo)
        }
        return next
      })
      if (response.lookups) {
        setCategories(response.lookups.categories)
        setSuppliers(response.lookups.suppliers)
        setManufacturers(response.lookups.manufacturers)
      }
    } finally {
      setLoading(false)
    }
  }, [canUseFilters, query])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts, refreshToken])

  const listTitle = title ?? 'Список товаров'

  const roleText = useMemo(() => getRoleName(roleCode), [roleCode])

  const categoryOptions = categories.map(toLookupOption).filter((item) => item !== null)
  const supplierOptions = suppliers.map(toLookupOption).filter((item) => item !== null)
  const manufacturerOptions = manufacturers.map(toLookupOption).filter((item) => item !== null)

  const rowClassName = (product: ProductItem): string => {
    if (product.stockQty === 0) {
      return 'product-row out-of-stock'
    }
    if (product.discountPercent > 15) {
      return 'product-row high-discount'
    }
    return 'product-row'
  }

  useEffect(() => {
    if (!canUseFilters) return
    const timeoutId = window.setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput.trim() || undefined,
      }))
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [canUseFilters, searchInput])

  const resetFilters = () => {
    setSearchInput('')
    setDiscountRange('all')
    setQuery((prev) => ({
      page: 1,
      pageSize: prev.pageSize,
      sortBy: prev.sortBy,
      sortDir: 'asc',
      categoryId: undefined,
      supplierId: undefined,
      manufacturerId: undefined,
      discountFrom: undefined,
      discountTo: undefined,
      search: undefined,
    }))
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setSubmitLoading(true)
    try {
      const response = await deleteProduct(deletingProduct.article, roleCode)
      if (!response.ok) {
        Modal.error({
          title: 'Ошибка удаления товара',
          content: response.message ?? 'Не удалось удалить товар. Проверьте связи товара с заказами.',
        })
        return
      }
      setDeletingProduct(null)
      message.success('Товар удален. Список обновлен.')
      await loadProducts()
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Card
      title={listTitle}
      loading={loading}
      extra={
        <Space>
          <Typography.Text type="secondary">Режим: {roleText}</Typography.Text>
          {showBackButton && onBack ? <Button onClick={onBack}>Назад к авторизации</Button> : null}
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {error ? <Alert type="error" message={error} showIcon /> : null}

        {canUseFilters ? (
          <div className="product-filters">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Поиск по товару, категории, описанию, поставщику, производителю..."
              allowClear
            />
            <Select
              allowClear
              value={query.categoryId}
              options={categoryOptions}
              placeholder="Категория"
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, categoryId: toOptionalNumber(value) }))}
            />
            <Select
              allowClear
              value={query.supplierId}
              options={supplierOptions}
              placeholder="Поставщик"
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, supplierId: toOptionalNumber(value) }))}
            />
            <Select
              allowClear
              value={query.manufacturerId}
              options={manufacturerOptions}
              placeholder="Производитель"
              onChange={(value) =>
                setQuery((prev) => ({ ...prev, page: 1, manufacturerId: toOptionalNumber(value) }))
              }
            />
            <Select
              value={discountRange}
              options={DISCOUNT_RANGE_OPTIONS}
              onChange={(value: DiscountRangeValue) => {
                setDiscountRange(value)
                const mapped = mapDiscountRange(value)
                setQuery((prev) => ({ ...prev, page: 1, ...mapped }))
              }}
            />
            <Select
              value={query.sortBy}
              options={SORT_OPTIONS}
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, sortBy: value }))}
            />
            <Select
              value={query.sortDir}
              options={[
                { value: 'asc', label: 'Сортировка ↑' },
                { value: 'desc', label: 'Сортировка ↓' },
              ]}
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, sortDir: value }))}
            />
            <Segmented
              options={[
                { label: 'Все товары', value: 'all' },
                { label: 'Только в наличии', value: 'stock' },
              ]}
              value={query.inStockOnly ? 'stock' : 'all'}
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, inStockOnly: value === 'stock' || undefined }))}
            />
            <Button onClick={resetFilters}>Сбросить</Button>
          </div>
        ) : null}

        {canManage ? (
          <Flex justify="end">
            <Button type="primary" onClick={onAddProduct}>
              Добавить товар
            </Button>
          </Flex>
        ) : null}

        {items.length === 0 ? (
          <Empty description="Товары не найдены" />
        ) : (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {items.map((product) => {
              const hasDiscount = product.discountPercent > 0
              return (
                <div
                  key={product.article}
                  className={rowClassName(product)}
                  onClick={() => canManage && onEditProduct?.(product)}
                  role={canManage ? 'button' : undefined}
                  tabIndex={canManage ? 0 : -1}
                  onKeyDown={(event) => {
                    if (canManage && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      onEditProduct?.(product)
                    }
                  }}
                >
                  <div className="product-photo-cell">
                    <Image
                      src={imageSourceByArticle[product.article] ?? getImageSrc(product.photo)}
                      alt={product.name}
                      preview={false}
                      className="product-photo"
                      onError={() => {
                        const candidates = buildImageCandidates(product.photo)
                        const current = imageSourceByArticle[product.article] ?? getImageSrc(product.photo)
                        const index = candidates.indexOf(current)
                        const next = candidates[Math.min(index + 1, candidates.length - 1)]
                        if (next !== current) {
                          setImageSourceByArticle((prev) => ({ ...prev, [product.article]: next }))
                        }
                        return false
                      }}
                    />
                  </div>
                  <div className="product-main-cell">
                    <div className="product-title-line">
                      <Typography.Text strong>{product.categoryName}</Typography.Text>
                      <Typography.Text type="secondary">|</Typography.Text>
                      <Typography.Text strong>{product.name}</Typography.Text>
                    </div>
                    <div className="product-fields">
                      <Typography.Text>Описание товара: {product.description || '—'}</Typography.Text>
                      <Typography.Text>Производитель: {product.manufacturerName}</Typography.Text>
                      <Typography.Text>Поставщик: {product.supplierName}</Typography.Text>
                      <div className="product-price-row">
                        <Typography.Text>Цена:&nbsp;</Typography.Text>
                        {hasDiscount ? (
                          <>
                            <Typography.Text className="base-price-discounted">{CURRENCY_FORMATTER.format(product.price)}</Typography.Text>
                            <Typography.Text className="final-price">{CURRENCY_FORMATTER.format(product.discountedPrice)}</Typography.Text>
                          </>
                        ) : (
                          <Typography.Text>{CURRENCY_FORMATTER.format(product.price)}</Typography.Text>
                        )}
                      </div>
                      <Typography.Text>Единица измерения: {product.unit}</Typography.Text>
                      <Typography.Text>Количество на складе: {product.stockQty}</Typography.Text>
                    </div>
                    {canManage ? (
                      <Space size={8} className="product-actions">
                        <Button
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditProduct?.(product)
                          }}
                        >
                          Редактировать
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeletingProduct(product)
                          }}
                        >
                          Удалить
                        </Button>
                      </Space>
                    ) : null}
                  </div>
                  <div className="product-discount-cell">
                    <Typography.Text strong>Действующая скидка</Typography.Text>
                    <Typography.Text>{product.discountPercent}%</Typography.Text>
                  </div>
                </div>
              )
            })}
          </Space>
        )}

        <Flex justify="center">
          <Pagination
            current={query.page ?? 1}
            pageSize={query.pageSize ?? 5}
            onChange={(page, pageSize) => setQuery((prev) => ({ ...prev, page, pageSize }))}
            total={total}
            showSizeChanger
            showTotal={(value) => `Всего товаров: ${value}`}
          />
        </Flex>
      </Space>

      <Modal
        title="Удаление товара"
        open={Boolean(deletingProduct)}
        onOk={() => void handleDelete()}
        onCancel={() => setDeletingProduct(null)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        confirmLoading={submitLoading}
      >
        <Typography.Text>
          Удалить товар <Typography.Text strong>{deletingProduct?.name}</Typography.Text>?
        </Typography.Text>
      </Modal>
    </Card>
  )
}

