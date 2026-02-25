import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Image, Input, InputNumber, Modal, Select, Space, Typography, message } from 'antd'
import { createProduct, getProduct, listProducts, saveProductImage, updateProduct } from '../api/client'
import type { ProductItem, ProductLookupItem, ProductWritePayload, UserRoleCode } from '../types/electron-api'

type ProductFormProps = {
  mode: 'create' | 'edit'
  roleCode: UserRoleCode
  product?: ProductItem | null
  onBack: () => void
  onSaved: () => void
}

type ProductFormValues = {
  name: string
  unit: string
  price: number
  supplierId: number
  manufacturerId: number
  categoryId: number
  discountPercent: number
  stockQty: number
  description?: string
}

const PLACEHOLDER_IMAGE = 'images/picture.png'

function buildImageCandidates(photo: string | null | undefined): string[] {
  if (!photo) {
    return [PLACEHOLDER_IMAGE]
  }

  const trimmed = photo.trim()
  if (!trimmed) {
    return [PLACEHOLDER_IMAGE]
  }

  const normalized = trimmed.replace(/^\/+/, '').replace(/^images\//, '')
  const dotIdx = normalized.lastIndexOf('.')
  if (dotIdx === -1) {
    return [`images/${normalized}`, PLACEHOLDER_IMAGE]
  }

  const name = normalized.slice(0, dotIdx)
  const ext = normalized.slice(dotIdx + 1)
  const upperExt = ext.toUpperCase()
  const lowerExt = ext.toLowerCase()
  if (upperExt === lowerExt) {
    return [`images/${normalized}`, PLACEHOLDER_IMAGE]
  }

  return [`images/${name}.${ext}`, `images/${name}.${upperExt}`, `images/${name}.${lowerExt}`, PLACEHOLDER_IMAGE]
}

function toNullable(value?: string): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toWritePayload(values: ProductFormValues, photo: string | null): ProductWritePayload {
  return {
    name: values.name.trim(),
    unit: values.unit.trim(),
    price: Number(values.price),
    supplierId: Number(values.supplierId),
    manufacturerId: Number(values.manufacturerId),
    categoryId: Number(values.categoryId),
    discountPercent: Number(values.discountPercent),
    stockQty: Number(values.stockQty),
    description: toNullable(values.description),
    photo,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'))
    reader.readAsDataURL(file)
  })
}

function readImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.width, height: image.height })
    image.onerror = () => reject(new Error('Файл не является корректным изображением'))
    image.src = dataUrl
  })
}

export function ProductForm({ mode, roleCode, product, onBack, onSaved }: ProductFormProps) {
  const [form] = Form.useForm<ProductFormValues>()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductLookupItem[]>([])
  const [suppliers, setSuppliers] = useState<ProductLookupItem[]>([])
  const [manufacturers, setManufacturers] = useState<ProductLookupItem[]>([])
  const [freshProduct, setFreshProduct] = useState<ProductItem | null>(null)
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string>(PLACEHOLDER_IMAGE)

  const title = mode === 'create' ? 'Добавление товара' : 'Редактирование товара'
  const effectiveProduct = mode === 'edit' ? freshProduct ?? product ?? null : null

  useEffect(() => {
    if (mode !== 'edit') {
      setFreshProduct(null)
      return
    }
    const loadProduct = async () => {
      if (mode !== 'edit' || !product) return
      const response = await getProduct(product.article)
      if (response.ok && response.item) {
        setFreshProduct(response.item)
      }
    }
    void loadProduct()
  }, [mode, product])

  useEffect(() => {
    if (mode === 'edit' && !effectiveProduct) {
      setError('Не удалось открыть форму редактирования: товар не выбран.')
      return
    }

    setError(null)
    form.setFieldsValue({
      name: effectiveProduct?.name ?? '',
      unit: effectiveProduct?.unit ?? 'шт.',
      price: effectiveProduct?.price ?? 0,
      categoryId: effectiveProduct?.categoryId,
      supplierId: effectiveProduct?.supplierId,
      manufacturerId: effectiveProduct?.manufacturerId,
      discountPercent: effectiveProduct?.discountPercent ?? 0,
      stockQty: effectiveProduct?.stockQty ?? 0,
      description: effectiveProduct?.description ?? '',
    })
  }, [effectiveProduct, form, mode])

  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true)
      try {
        const response = await listProducts({ page: 1, pageSize: 1, sortBy: 'price', sortDir: 'asc' })
        if (!response.ok || !response.lookups) {
          setError(response.message ?? 'Не удалось загрузить справочники для формы товара')
          return
        }
        setCategories(response.lookups.categories)
        setSuppliers(response.lookups.suppliers)
        setManufacturers(response.lookups.manufacturers)
      } finally {
        setLoading(false)
      }
    }

    void loadLookups()
  }, [])

  const previewSrc = useMemo(() => {
    if (uploadDataUrl) return uploadDataUrl
    const candidates = buildImageCandidates(effectiveProduct?.photo)
    return candidates[0] ?? PLACEHOLDER_IMAGE
  }, [effectiveProduct?.photo, uploadDataUrl])

  useEffect(() => {
    setImageSrc(previewSrc)
  }, [previewSrc])

  const categoryOptions = categories.map((item) => ({ value: item.id, label: item.name }))
  const supplierOptions = suppliers.map((item) => ({ value: item.id, label: item.name }))
  const manufacturerOptions = manufacturers.map((item) => ({ value: item.id, label: item.name }))

  const handleSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const { width, height } = await readImageSize(dataUrl)
      // Assignment requires exact 300x200, so we reject any other dimensions before save.
      if (width !== 300 || height !== 200) {
        Modal.warning({
          title: 'Неверный размер изображения',
          content: 'Изображение должно иметь размер строго 300x200 пикселей. Выберите другое изображение.',
        })
        event.target.value = ''
        return
      }
      setUploadDataUrl(dataUrl)
      setUploadName(file.name)
      message.info('Изображение загружено и будет сохранено после нажатия "Сохранить".')
    } catch (imageError) {
      Modal.error({
        title: 'Ошибка загрузки изображения',
        content: imageError instanceof Error ? imageError.message : 'Не удалось обработать изображение',
      })
    }
  }

  const handleSubmit = async () => {
    if (roleCode !== 'admin') {
      Modal.warning({
        title: 'Доступ запрещен',
        content: 'Добавление и редактирование товаров доступно только администратору.',
      })
      return
    }

    if (mode === 'edit' && !effectiveProduct) return

    try {
      const values = await form.validateFields()
      setSubmitLoading(true)

      let photo = effectiveProduct?.photo ?? null
      if (uploadDataUrl) {
        const saveImageResponse = await saveProductImage(
          {
            dataUrl: uploadDataUrl,
            previousPhoto: mode === 'edit' ? effectiveProduct?.photo : null,
          },
          roleCode,
        )

        if (!saveImageResponse.ok || !saveImageResponse.photo) {
          Modal.error({
            title: 'Ошибка сохранения изображения',
            content: saveImageResponse.message ?? 'Не удалось сохранить изображение товара.',
          })
          return
        }
        photo = saveImageResponse.photo
      }

      const payload = toWritePayload(values, photo)
      const response =
        mode === 'create'
          ? await createProduct(payload, roleCode)
          : await updateProduct(effectiveProduct!.article, payload, roleCode)

      if (!response.ok) {
        Modal.error({
          title: mode === 'create' ? 'Ошибка добавления товара' : 'Ошибка редактирования товара',
          content: response.message ?? 'Операция не выполнена. Проверьте введенные данные и повторите попытку.',
        })
        return
      }

      message.success(mode === 'create' ? 'Товар успешно добавлен' : 'Изменения по товару сохранены')
      onSaved()
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Card
      title={title}
      loading={loading}
      extra={
        <Space>
          <Typography.Text type="secondary">Режим: Администратор</Typography.Text>
          <Button onClick={onBack}>Назад к списку</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {error ? <Alert type="error" showIcon message={error} /> : null}

        {mode === 'edit' ? (
          <Alert
            type="info"
            showIcon
            message={`ID товара (только чтение): ${effectiveProduct?.article ?? '—'}`}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message='ID товара будет рассчитан автоматически при сохранении (последний ID + 1).'
          />
        )}

        <Image
          src={imageSrc}
          alt="Изображение товара"
          width={300}
          height={200}
          style={{ objectFit: 'cover' }}
          onError={() => {
            if (uploadDataUrl) {
              setImageSrc(PLACEHOLDER_IMAGE)
              return false
            }

            const candidates = buildImageCandidates(effectiveProduct?.photo)
            const currentIndex = candidates.indexOf(imageSrc)
            const nextIndex = Math.min(currentIndex + 1, candidates.length - 1)
            const nextSrc = candidates[nextIndex] ?? PLACEHOLDER_IMAGE
            if (nextSrc !== imageSrc) {
              setImageSrc(nextSrc)
            }
            return false
          }}
        />

        <Space>
          <label htmlFor="product-image-input">
            <Button>Загрузить/заменить фото</Button>
          </label>
          <input
            id="product-image-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(event) => void handleSelectImage(event)}
            style={{ display: 'none' }}
          />
          <Typography.Text type="secondary">{uploadName ?? 'Файл не выбран'}</Typography.Text>
        </Space>

        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Наименование товара"
            rules={[{ required: true, message: 'Укажите наименование товара' }]}
            extra="Введите полное наименование товара."
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Категория товара"
            rules={[{ required: true, message: 'Выберите категорию товара' }]}
          >
            <Select options={categoryOptions} placeholder="Выберите категорию" />
          </Form.Item>

          <Form.Item name="description" label="Описание товара" extra="Опишите ключевые характеристики товара.">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
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

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Укажите цену товара' }]}
            extra="Цена может включать сотые части и не может быть отрицательной."
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Единица измерения"
            rules={[{ required: true, message: 'Укажите единицу измерения' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="stockQty"
            label="Количество на складе"
            rules={[{ required: true, message: 'Укажите количество на складе' }]}
            extra="Минимальное количество - 0."
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="discountPercent"
            label="Действующая скидка (%)"
            rules={[{ required: true, message: 'Укажите размер действующей скидки' }]}
          >
            <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>

        <Space>
          <Button type="primary" onClick={() => void handleSubmit()} loading={submitLoading}>
            Сохранить
          </Button>
          <Button onClick={onBack}>Отмена</Button>
        </Space>
      </Space>
    </Card>
  )
}
