import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Empty, Flex, Input, Modal, Pagination, Select, Space, Typography, message } from 'antd'
import { deleteOrder, listOrders } from '../api/client'
import type { OrderItem, OrderListRequest, UserRoleCode } from '../types/electron-api'
import './OrdersList.css'

type OrdersListProps = {
  roleCode: UserRoleCode
  refreshToken?: number
  onAddOrder?: () => void
  onEditOrder?: (order: OrderItem) => void
}

type OrderSortBy = NonNullable<OrderListRequest['sortBy']>

const SORT_OPTIONS: Array<{ value: OrderSortBy; label: string }> = [
  { value: 'id', label: 'По ID' },
  { value: 'orderDate', label: 'По дате заказа' },
  { value: 'deliveryDate', label: 'По дате выдачи' },
  { value: 'status', label: 'По статусу' },
]

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function getRoleName(roleCode: UserRoleCode): string {
  switch (roleCode) {
    case 'admin':
      return 'Администратор'
    case 'manager':
      return 'Менеджер'
    default:
      return 'Пользователь'
  }
}

export function OrdersList({ roleCode, refreshToken, onAddOrder, onEditOrder }: OrdersListProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [pickupPoints, setPickupPoints] = useState<Array<{ id: number; label: string }>>([])
  const [users, setUsers] = useState<Array<{ id: number; fullName: string }>>([])
  const [deletingOrder, setDeletingOrder] = useState<OrderItem | null>(null)
  const [query, setQuery] = useState<OrderListRequest>({
    page: 1,
    pageSize: 7,
    sortBy: 'id',
    sortDir: 'asc',
  })
  const [searchInput, setSearchInput] = useState('')

  const canManage = roleCode === 'admin'

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listOrders(query, roleCode)
      if (!response.ok || !response.items || typeof response.total !== 'number') {
        setError(response.message ?? 'Не удалось загрузить список заказов')
        return
      }
      setItems(response.items)
      setTotal(response.total)
      if (response.lookups) {
        setStatuses(response.lookups.statuses)
        setPickupPoints(response.lookups.pickupPoints)
        setUsers(response.lookups.users)
      }
    } finally {
      setLoading(false)
    }
  }, [query, roleCode])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders, refreshToken])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, page: 1, search: searchInput.trim() || undefined }))
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const handleDelete = async () => {
    if (!deletingOrder) return
    setSubmitLoading(true)
    try {
      const response = await deleteOrder(deletingOrder.id, roleCode)
      if (!response.ok) {
        Modal.error({
          title: 'Ошибка удаления заказа',
          content: response.message ?? 'Не удалось удалить заказ',
        })
        return
      }
      setDeletingOrder(null)
      message.success('Заказ удален. Список обновлен.')
      await loadOrders()
    } finally {
      setSubmitLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchInput('')
    setQuery((prev) => ({
      page: 1,
      pageSize: prev.pageSize,
      sortBy: prev.sortBy,
      sortDir: 'asc',
      search: undefined,
      status: undefined,
      pickupPointId: undefined,
      userId: undefined,
    }))
  }

  const roleName = useMemo(() => getRoleName(roleCode), [roleCode])

  return (
    <Card
      title="Список заказов"
      loading={loading}
      extra={<Typography.Text type="secondary">Режим: {roleName}</Typography.Text>}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {error ? <Alert type="error" message={error} showIcon /> : null}

        <div className="orders-filters">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по ID, статусу, коду выдачи, клиенту, адресу..."
            allowClear
          />
          <Select
            allowClear
            value={query.status}
            options={statuses.map((status) => ({ value: status, label: status }))}
            placeholder="Статус заказа"
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, status: value }))}
          />
          <Select
            allowClear
            value={query.pickupPointId}
            options={pickupPoints.map((point) => ({ value: point.id, label: point.label }))}
            placeholder="Пункт выдачи"
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, pickupPointId: toOptionalNumber(value) }))}
          />
          <Select
            allowClear
            value={query.userId}
            options={users.map((user) => ({ value: user.id, label: user.fullName }))}
            placeholder="Клиент"
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, userId: toOptionalNumber(value) }))}
          />
          <Select
            value={query.sortBy}
            options={SORT_OPTIONS}
            onChange={(value: OrderSortBy) => setQuery((prev) => ({ ...prev, page: 1, sortBy: value }))}
          />
          <Select
            value={query.sortDir}
            options={[
              { value: 'asc', label: 'Сортировка ↑' },
              { value: 'desc', label: 'Сортировка ↓' },
            ]}
            onChange={(value: 'asc' | 'desc') => setQuery((prev) => ({ ...prev, page: 1, sortDir: value }))}
          />
          <Button onClick={resetFilters}>Сбросить</Button>
        </div>

        {canManage ? (
          <Flex justify="end">
            <Button type="primary" onClick={onAddOrder}>
              Добавить заказ
            </Button>
          </Flex>
        ) : null}

        {items.length === 0 ? (
          <Empty description="Заказы не найдены" />
        ) : (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {items.map((order) => (
              <div
                key={order.id}
                className="order-row"
                onClick={() => onEditOrder?.(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onEditOrder?.(order)
                  }
                }}
              >
                <div className="order-main-cell">
                  <div className="order-title-line">
                    <Typography.Text strong>Заказ №{order.id}</Typography.Text>
                    <Typography.Text type="secondary">|</Typography.Text>
                    <Typography.Text>{order.status}</Typography.Text>
                  </div>
                  <div className="order-fields">
                    <Typography.Text>Дата заказа: {order.orderDate}</Typography.Text>
                    <Typography.Text>Дата выдачи: {order.deliveryDate}</Typography.Text>
                    <Typography.Text>Пункт выдачи: {order.pickupPointLabel}</Typography.Text>
                    <Typography.Text>Клиент: {order.userFullName}</Typography.Text>
                    <Typography.Text>Код выдачи: {order.pickupCode}</Typography.Text>
                  </div>
                </div>
                {canManage ? (
                  <div className="order-actions-cell">
                    <Button
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEditOrder?.(order)
                      }}
                    >
                      Редактировать
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeletingOrder(order)
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </Space>
        )}

        <Flex justify="center">
          <Pagination
            current={query.page ?? 1}
            pageSize={query.pageSize ?? 7}
            onChange={(page, pageSize) => setQuery((prev) => ({ ...prev, page, pageSize }))}
            total={total}
            showSizeChanger
            showTotal={(value) => `Всего заказов: ${value}`}
          />
        </Flex>
      </Space>

      <Modal
        title="Удаление заказа"
        open={Boolean(deletingOrder)}
        onOk={() => void handleDelete()}
        onCancel={() => setDeletingOrder(null)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        confirmLoading={submitLoading}
      >
        <Typography.Text>
          Удалить заказ <Typography.Text strong>№{deletingOrder?.id}</Typography.Text>?
        </Typography.Text>
      </Modal>
    </Card>
  )
}
