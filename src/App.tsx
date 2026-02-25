import { useState } from 'react'
import { Alert, App as AntApp, Button, Card, Flex, Form, Input, Space, Tag, Typography } from 'antd'
import { login as loginApi } from './api/client'
import { OrderForm } from './components/OrderForm'
import { OrdersList } from './components/OrdersList'
import { ProductList } from './components/ProductList'
import { ProductForm } from './components/ProductForm'
import type { OrderItem, ProductItem, UserRoleCode } from './types/electron-api'
import './App.css'

type AuthUser = NonNullable<Awaited<ReturnType<typeof loginApi>>['user']>
type ScreenMode = 'auth' | 'guest'
type SectionMode = 'products' | 'orders'
type ProductScreenMode = 'list' | 'create' | 'edit'
type OrderScreenMode = 'list' | 'create' | 'edit'

function normalizeRoleCode(roleCode: string): UserRoleCode {
  if (roleCode === 'admin' || roleCode === 'manager' || roleCode === 'client') {
    return roleCode
  }
  return 'client'
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [screenMode, setScreenMode] = useState<ScreenMode>('auth')
  const [sectionMode, setSectionMode] = useState<SectionMode>('products')
  const [productScreenMode, setProductScreenMode] = useState<ProductScreenMode>('list')
  const [orderScreenMode, setOrderScreenMode] = useState<OrderScreenMode>('list')
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [ordersRefreshToken, setOrdersRefreshToken] = useState(0)
  const [loginValue, setLoginValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { message } = AntApp.useApp()
  const brandHeader = (
    <div className="app-brand-bar" aria-label="Бренд приложения">
      <img className="app-brand-logo" src="images/icon.png" alt="Логотип компании Велосипед Драйв" />
      <Typography.Title level={4} className="app-brand-title">
        Велосипед Драйв
      </Typography.Title>
    </div>
  )

  const handleLogin = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const response = await loginApi(loginValue, passwordValue)
      if (!response.ok || !response.user) {
        setAuthError(response.message ?? 'Invalid login or password')
        return
      }

      setAuthUser(response.user)
      setScreenMode('auth')
      setSectionMode('products')
      setProductScreenMode('list')
      setOrderScreenMode('list')
      setEditingProduct(null)
      setEditingOrder(null)
      setPasswordValue('')
      message.success(`Вход выполнен: ${response.user.fullName}`)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setAuthUser(null)
    setScreenMode('auth')
    setSectionMode('products')
    setProductScreenMode('list')
    setOrderScreenMode('list')
    setEditingProduct(null)
    setEditingOrder(null)
    setLoginValue('')
    setPasswordValue('')
    setAuthError(null)
  }

  if (!authUser && screenMode === 'guest') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Просмотр каталога товаров
          </Typography.Title>
          <ProductList roleCode="guest" showBackButton onBack={() => setScreenMode('auth')} />
        </Space>
      </div>
    )
  }

  if (!authUser && screenMode === 'auth') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Авторизация
          </Typography.Title>
          <Card title="Форма входа" className="login-card">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {authError ? <Alert type="error" message={authError} showIcon /> : null}
              <Form layout="vertical" onFinish={() => void handleLogin()}>
                <Form.Item label="Логин" required>
                  <Input
                    value={loginValue}
                    onChange={(event) => setLoginValue(event.target.value)}
                    autoComplete="username"
                    placeholder="Введите логин"
                  />
                </Form.Item>
                <Form.Item label="Пароль" required style={{ marginBottom: 12 }}>
                  <Input.Password
                    value={passwordValue}
                    onChange={(event) => setPasswordValue(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Введите пароль"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={authLoading} block>
                  Войти
                </Button>
              </Form>
              <Button onClick={() => setScreenMode('guest')} block>
                Продолжить как гость
              </Button>
            </Space>
          </Card>
        </Space>
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  const roleCode = normalizeRoleCode(authUser.role.code)
  const canOpenOrders = roleCode === 'admin' || roleCode === 'manager'

  if (sectionMode === 'orders' && canOpenOrders && orderScreenMode === 'create') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Добавление заказа
          </Typography.Title>
          <OrderForm
            mode="create"
            roleCode={roleCode}
            onBack={() => setOrderScreenMode('list')}
            onSaved={() => {
              setOrderScreenMode('list')
              setOrdersRefreshToken((prev) => prev + 1)
            }}
          />
        </Space>
      </div>
    )
  }

  if (sectionMode === 'orders' && canOpenOrders && orderScreenMode === 'edit') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Редактирование заказа
          </Typography.Title>
          <OrderForm
            mode="edit"
            roleCode={roleCode}
            order={editingOrder}
            onBack={() => setOrderScreenMode('list')}
            onSaved={() => {
              setOrderScreenMode('list')
              setEditingOrder(null)
              setOrdersRefreshToken((prev) => prev + 1)
            }}
          />
        </Space>
      </div>
    )
  }

  if (productScreenMode === 'create') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Добавление товара
          </Typography.Title>
          <ProductForm
            mode="create"
            roleCode={roleCode}
            onBack={() => setProductScreenMode('list')}
            onSaved={() => {
              setProductScreenMode('list')
              setRefreshToken((prev) => prev + 1)
            }}
          />
        </Space>
      </div>
    )
  }

  if (productScreenMode === 'edit') {
    return (
      <div className="app-shell">
        {brandHeader}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Редактирование товара
          </Typography.Title>
          <ProductForm
            mode="edit"
            roleCode={roleCode}
            product={editingProduct}
            onBack={() => setProductScreenMode('list')}
            onSaved={() => {
              setProductScreenMode('list')
              setEditingProduct(null)
              setRefreshToken((prev) => prev + 1)
            }}
          />
        </Space>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {brandHeader}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Flex align="center" justify="space-between" gap={12} wrap>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            {sectionMode === 'orders' && canOpenOrders ? 'Заказы' : 'Каталог товаров'}
          </Typography.Title>
          <Space size={8} wrap>
            <Tag>{authUser.fullName}</Tag>
            <Tag color="blue">Роль: {authUser.role.name}</Tag>
            <Button
              type={sectionMode === 'products' ? 'primary' : 'default'}
              onClick={() => {
                setSectionMode('products')
                setProductScreenMode('list')
                setEditingProduct(null)
              }}
            >
              Товары
            </Button>
            {canOpenOrders ? (
              <Button
                type={sectionMode === 'orders' ? 'primary' : 'default'}
                onClick={() => {
                  setSectionMode('orders')
                  setOrderScreenMode('list')
                  setEditingOrder(null)
                }}
              >
                Заказы
              </Button>
            ) : null}
            <Button onClick={handleLogout}>Выйти</Button>
          </Space>
        </Flex>
        <Typography.Text type="secondary">Функционал зависит от роли пользователя.</Typography.Text>
        {sectionMode === 'orders' && canOpenOrders ? (
          <OrdersList
            roleCode={roleCode}
            refreshToken={ordersRefreshToken}
            onAddOrder={() => setOrderScreenMode('create')}
            onEditOrder={(order) => {
              setEditingOrder(order)
              setOrderScreenMode('edit')
            }}
          />
        ) : (
          <ProductList
            roleCode={roleCode}
            refreshToken={refreshToken}
            onAddProduct={() => setProductScreenMode('create')}
            onEditProduct={(product) => {
              setEditingProduct(product)
              setProductScreenMode('edit')
            }}
          />
        )}
      </Space>
    </div>
  )
}

export default App
