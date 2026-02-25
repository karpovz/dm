import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Input, Select, Space, Typography, message } from 'antd'
import { createOrder, getOrder, listOrders, updateOrder } from '../api/client'
import type { OrderItem, OrderWritePayload, UserRoleCode } from '../types/electron-api'
import './OrderForm.css'

type OrderFormProps = {
  mode: 'create' | 'edit'
  roleCode: UserRoleCode
  order?: OrderItem | null
  onBack: () => void
  onSaved: () => void
}

type OrderFormValues = {
  status: string
  pickupPointId: number
  orderDate: string
  deliveryDate: string
  userId: number
  pickupCode: string
}

function toWritePayload(values: OrderFormValues): OrderWritePayload {
  return {
    status: values.status.trim(),
    pickupPointId: Number(values.pickupPointId),
    orderDate: values.orderDate,
    deliveryDate: values.deliveryDate,
    userId: Number(values.userId),
    pickupCode: values.pickupCode.trim(),
  }
}

export function OrderForm({ mode, roleCode, order, onBack, onSaved }: OrderFormProps) {
  const [form] = Form.useForm<OrderFormValues>()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [pickupPoints, setPickupPoints] = useState<Array<{ id: number; label: string }>>([])
  const [users, setUsers] = useState<Array<{ id: number; fullName: string }>>([])
  const [freshOrder, setFreshOrder] = useState<OrderItem | null>(null)

  const canManage = roleCode === 'admin'
  const title = mode === 'create' ? 'Добавление заказа' : 'Редактирование заказа'
  const effectiveOrder = mode === 'edit' ? freshOrder ?? order ?? null : null

  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await listOrders({ page: 1, pageSize: 1, sortBy: 'id', sortDir: 'asc' }, roleCode)
        if (!response.ok || !response.lookups) {
          setError(response.message ?? 'Не удалось загрузить справочники заказов')
          return
        }
        setStatuses(response.lookups.statuses)
        setPickupPoints(response.lookups.pickupPoints)
        setUsers(response.lookups.users)
      } finally {
        setLoading(false)
      }
    }
    void loadLookups()
  }, [roleCode])

  useEffect(() => {
    if (mode !== 'edit') {
      setFreshOrder(null)
      return
    }
    if (!order) {
      setError('Не удалось открыть форму редактирования: заказ не выбран.')
      return
    }

    const loadOrder = async () => {
      setLoading(true)
      try {
        const response = await getOrder(order.id, roleCode)
        if (!response.ok || !response.item) {
          setError(response.message ?? 'Не удалось загрузить заказ')
          return
        }
        setFreshOrder(response.item)
      } finally {
        setLoading(false)
      }
    }
    void loadOrder()
  }, [mode, order, roleCode])

  useEffect(() => {
    if (mode === 'edit' && !effectiveOrder) {
      return
    }
    form.setFieldsValue({
      status: effectiveOrder?.status ?? statuses[0] ?? 'Новый',
      pickupPointId: effectiveOrder?.pickupPointId ?? pickupPoints[0]?.id,
      orderDate: effectiveOrder?.orderDate ?? '',
      deliveryDate: effectiveOrder?.deliveryDate ?? '',
      userId: effectiveOrder?.userId ?? users[0]?.id,
      pickupCode: effectiveOrder?.pickupCode ?? '',
    })
  }, [effectiveOrder, form, mode, pickupPoints, statuses, users])

  const roleText = useMemo(() => (canManage ? 'Администратор' : 'Менеджер (только просмотр)'), [canManage])

  const handleSubmit = async () => {
    if (!canManage) {
      return
    }
    if (mode === 'edit' && !effectiveOrder) {
      return
    }

    try {
      const values = await form.validateFields()
      setSubmitLoading(true)
      const payload = toWritePayload(values)
      const response =
        mode === 'create' ? await createOrder(payload, roleCode) : await updateOrder(effectiveOrder!.id, payload, roleCode)

      if (!response.ok) {
        setError(response.message ?? 'Не удалось сохранить заказ')
        return
      }

      message.success(mode === 'create' ? 'Заказ успешно добавлен' : 'Изменения по заказу сохранены')
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
          <Typography.Text type="secondary">Режим: {roleText}</Typography.Text>
          <Button onClick={onBack}>Назад к списку</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {error ? <Alert type="error" showIcon message={error} /> : null}
        {!canManage ? (
          <Alert type="info" showIcon message="Менеджер может просматривать заказы, но не может изменять данные." />
        ) : null}

        {mode === 'edit' ? (
          <Alert type="info" showIcon message={`ID заказа (только чтение): ${effectiveOrder?.id ?? '—'}`} />
        ) : (
          <Alert type="info" showIcon message="ID заказа будет рассчитан автоматически (последний ID + 1)." />
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Статус заказа" rules={[{ required: true, message: 'Выберите статус заказа' }]}>
            <Select
              options={statuses.map((status) => ({ value: status, label: status }))}
              placeholder="Выберите статус"
              disabled={!canManage}
            />
          </Form.Item>

          <Form.Item
            name="pickupPointId"
            label="Адрес пункта выдачи"
            rules={[{ required: true, message: 'Выберите пункт выдачи' }]}
          >
            <Select
              options={pickupPoints.map((point) => ({ value: point.id, label: point.label }))}
              placeholder="Выберите пункт выдачи"
              disabled={!canManage}
            />
          </Form.Item>

          <Form.Item name="orderDate" label="Дата заказа" rules={[{ required: true, message: 'Укажите дату заказа' }]}>
            <Input type="date" disabled={!canManage} />
          </Form.Item>

          <Form.Item name="deliveryDate" label="Дата выдачи" rules={[{ required: true, message: 'Укажите дату выдачи' }]}>
            <Input type="date" disabled={!canManage} />
          </Form.Item>

          <Form.Item name="userId" label="Клиент" rules={[{ required: true, message: 'Выберите клиента' }]}>
            <Select
              options={users.map((user) => ({ value: user.id, label: user.fullName }))}
              placeholder="Выберите клиента"
              disabled={!canManage}
            />
          </Form.Item>

          <Form.Item name="pickupCode" label="Код выдачи" rules={[{ required: true, message: 'Введите код выдачи' }]}>
            <Input placeholder="Например: 901" disabled={!canManage} />
          </Form.Item>
        </Form>

        <Space>
          {canManage ? (
            <Button type="primary" onClick={() => void handleSubmit()} loading={submitLoading}>
              Сохранить
            </Button>
          ) : null}
          <Button onClick={onBack}>{canManage ? 'Отмена' : 'Назад'}</Button>
        </Space>
      </Space>
    </Card>
  )
}
