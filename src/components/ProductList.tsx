import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Typography,
  message,
} from 'antd'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/client'
import type {
  ProductItem,
  ProductListRequest,
  ProductLookupItem,
  ProductSortBy,
  ProductWritePayload,
  UserRoleCode,
} from '../types/electron-api'
import './ProductList.css'

type ProductListProps = {
  roleCode: UserRoleCode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
}

type ProductFormValues = {
  article: string
  name: string
  unit: string
  price: number
  supplierId: number
  manufacturerId: number
  categoryId: number
  discountPercent: number
  stockQty: number
  description?: string
  photo?: string
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
})

const SORT_OPTIONS: Array<{ value: ProductSortBy; label: string }> = [
  { value: 'name', label: 'По наименованию' },
  { value: 'price', label: 'По цене' },
  { value: 'discountPercent', label: 'По скидке' },
  { value: 'stockQty', label: 'По остатку' },
  { value: 'categoryName', label: 'По категории' },
  { value: 'supplierName', label: 'По поставщику' },
  { value: 'manufacturerName', label: 'По производителю' },
]

function toNullable(value?: string): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toWritePayload(values: ProductFormValues): ProductWritePayload {
  return {
    article: values.article.trim(),
    name: values.name.trim(),
    unit: values.unit.trim(),
    price: Number(values.price),
    supplierId: Number(values.supplierId),
    manufacturerId: Number(values.manufacturerId),
    categoryId: Number(values.categoryId),
    discountPercent: Number(values.discountPercent),
    stockQty: Number(values.stockQty),
    description: toNullable(values.description),
    photo: toNullable(values.photo),
  }
}

function toInitialValues(product: ProductItem): ProductFormValues {
  return {
    article: product.article,
    name: product.name,
    unit: product.unit,
    price: product.price,
    supplierId: product.supplierId,
    manufacturerId: product.manufacturerId,
    categoryId: product.categoryId,
    discountPercent: product.discountPercent,
    stockQty: product.stockQty,
    description: product.description ?? '',
    photo: product.photo ?? '',
  }
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

export function ProductList({ roleCode, title, showBackButton = false, onBack }: ProductListProps) {
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
    sortBy: 'name',
    sortDir: 'asc',
  })
  const [searchInput, setSearchInput] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imageSourceByArticle, setImageSourceByArticle] = useState<Record<string, string>>({})

  const [addForm] = Form.useForm<ProductFormValues>()
  const [editForm] = Form.useForm<ProductFormValues>()

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
  }, [loadProducts])

  const listTitle = title ?? 'Список товаров'

  const roleText = useMemo(() => getRoleName(roleCode), [roleCode])

  const categoryOptions = categories.map((item) => ({ value: item.id, label: item.name }))
  const supplierOptions = suppliers.map((item) => ({ value: item.id, label: item.name }))
  const manufacturerOptions = manufacturers.map((item) => ({ value: item.id, label: item.name }))

  const rowClassName = (product: ProductItem): string => {
    if (product.stockQty === 0) {
      return 'product-row out-of-stock'
    }
    if (product.discountPercent > 15) {
      return 'product-row high-discount'
    }
    return 'product-row'
  }

  const applySearch = () => {
    if (!canUseFilters) return
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: searchInput.trim() || undefined,
    }))
  }

  const resetFilters = () => {
    setSearchInput('')
    setQuery((prev) => ({
      page: 1,
      pageSize: prev.pageSize,
      sortBy: 'name',
      sortDir: 'asc',
      categoryId: undefined,
      supplierId: undefined,
      manufacturerId: undefined,
      inStockOnly: undefined,
      discountFrom: undefined,
      discountTo: undefined,
      search: undefined,
    }))
  }

  const openCreateModal = () => {
    addForm.resetFields()
    addForm.setFieldsValue({
      article: '',
      name: '',
      unit: 'шт.',
      price: 0,
      categoryId: undefined,
      supplierId: undefined,
      manufacturerId: undefined,
      discountPercent: 0,
      stockQty: 0,
      description: '',
      photo: '',
    })
    setAddOpen(true)
  }

  const handleCreateSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      setSubmitLoading(true)
      const response = await createProduct(toWritePayload(values))
      if (!response.ok) {
        message.error(response.message ?? 'Не удалось добавить товар')
        return
      }
      setAddOpen(false)
      message.success('Товар добавлен')
      await loadProducts()
    } finally {
      setSubmitLoading(false)
    }
  }

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product)
    editForm.setFieldsValue(toInitialValues(product))
  }

  const handleEditSubmit = async () => {
    if (!editingProduct) return
    try {
      const values = await editForm.validateFields()
      setSubmitLoading(true)
      const response = await updateProduct(editingProduct.article, toWritePayload(values))
      if (!response.ok) {
        message.error(response.message ?? 'Не удалось обновить товар')
        return
      }
      setEditingProduct(null)
      message.success('Товар обновлен')
      await loadProducts()
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setSubmitLoading(true)
    try {
      const response = await deleteProduct(deletingProduct.article)
      if (!response.ok) {
        message.error(response.message ?? 'Не удалось удалить товар')
        return
      }
      setDeletingProduct(null)
      message.success('Товар удален')
      await loadProducts()
    } finally {
      setSubmitLoading(false)
    }
  }

  const renderFormContent = (includeEditableArticle: boolean) => (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {includeEditableArticle ? (
        <Form.Item name="article" label="Артикул" rules={[{ required: true, message: 'Укажите артикул' }]}>
          <Input placeholder="Например, A112T4" />
        </Form.Item>
      ) : null}
      <Form.Item
        name="name"
        label="Наименование товара"
        rules={[{ required: true, message: 'Укажите наименование товара' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="categoryId" label="Категория" rules={[{ required: true, message: 'Выберите категорию' }]}>
        <Select options={categoryOptions} placeholder="Выберите категорию" />
      </Form.Item>
      <Form.Item name="description" label="Описание товара">
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
      </Form.Item>
      <Form.Item
        name="manufacturerId"
        label="Производитель"
        rules={[{ required: true, message: 'Выберите производителя' }]}
      >
        <Select options={manufacturerOptions} placeholder="Выберите производителя" />
      </Form.Item>
      <Form.Item name="supplierId" label="Поставщик" rules={[{ required: true, message: 'Выберите поставщика' }]}>
        <Select options={supplierOptions} placeholder="Выберите поставщика" />
      </Form.Item>
      <Form.Item name="price" label="Цена" rules={[{ required: true, message: 'Укажите цену' }]}>
        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="unit" label="Единица измерения" rules={[{ required: true, message: 'Укажите единицу' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="stockQty" label="Количество на складе" rules={[{ required: true, message: 'Укажите остаток' }]}>
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="discountPercent" label="Действующая скидка (%)" rules={[{ required: true, message: 'Укажите скидку' }]}>
        <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="photo" label="Имя файла фото">
        <Input placeholder="Например, 1.jpg" />
      </Form.Item>
    </Space>
  )

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
              onPressEnter={applySearch}
              placeholder="Поиск по товару, категории, описанию, поставщику..."
            />
            <Button onClick={applySearch} type="primary">
              Найти
            </Button>
            <Select
              allowClear
              value={query.categoryId}
              options={categoryOptions}
              placeholder="Категория"
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, categoryId: value }))}
            />
            <Select
              allowClear
              value={query.supplierId}
              options={supplierOptions}
              placeholder="Поставщик"
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, supplierId: value }))}
            />
            <Select
              allowClear
              value={query.manufacturerId}
              options={manufacturerOptions}
              placeholder="Производитель"
              onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, manufacturerId: value }))}
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
            <Checkbox
              checked={Boolean(query.inStockOnly)}
              onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, inStockOnly: event.target.checked || undefined }))}
            >
              Только в наличии
            </Checkbox>
            <Button onClick={resetFilters}>Сбросить</Button>
          </div>
        ) : null}

        {canManage ? (
          <Flex justify="end">
            <Button type="primary" onClick={openCreateModal}>
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
                <div key={product.article} className={rowClassName(product)}>
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
                        <Button size="small" onClick={() => openEditModal(product)}>
                          Редактировать
                        </Button>
                        <Button size="small" danger onClick={() => setDeletingProduct(product)}>
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
        title="Добавление товара"
        open={addOpen}
        onOk={() => void handleCreateSubmit()}
        onCancel={() => setAddOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={submitLoading}
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          {renderFormContent(true)}
        </Form>
      </Modal>

      <Modal
        title="Редактирование товара"
        open={Boolean(editingProduct)}
        onOk={() => void handleEditSubmit()}
        onCancel={() => setEditingProduct(null)}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={submitLoading}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item name="article" label="Артикул">
            <Input disabled />
          </Form.Item>
          {renderFormContent(false)}
        </Form>
      </Modal>

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

