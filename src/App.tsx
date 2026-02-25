import { useState } from 'react'
import { Alert, App as AntApp, Button, Card, Flex, Form, Input, Space, Tag, Typography } from 'antd'
import { login as loginApi } from './api/client'
import { ProductList } from './components/ProductList'
import type { UserRoleCode } from './types/electron-api'
import './App.css'

type AuthUser = NonNullable<Awaited<ReturnType<typeof loginApi>>['user']>
type ScreenMode = 'auth' | 'guest'

function normalizeRoleCode(roleCode: string): UserRoleCode {
  if (roleCode === 'admin' || roleCode === 'manager' || roleCode === 'client') {
    return roleCode
  }
  return 'client'
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [screenMode, setScreenMode] = useState<ScreenMode>('auth')
  const [loginValue, setLoginValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { message } = AntApp.useApp()

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
      setPasswordValue('')
      message.success(`Вход выполнен: ${response.user.fullName}`)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setAuthUser(null)
    setScreenMode('auth')
    setLoginValue('')
    setPasswordValue('')
    setAuthError(null)
  }

  if (!authUser && screenMode === 'guest') {
    return (
      <div className="app-shell">
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
        <Card title="Авторизация" className="login-card">
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
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="app-shell">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Flex align="center" justify="space-between" gap={12} wrap>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Каталог товаров
          </Typography.Title>
          <Space size={8} wrap>
            <Tag>{authUser.fullName}</Tag>
            <Tag color="blue">Роль: {authUser.role.name}</Tag>
            <Button onClick={handleLogout}>Выйти</Button>
          </Space>
        </Flex>
        <Typography.Text type="secondary">Функционал зависит от роли пользователя.</Typography.Text>
        <ProductList roleCode={normalizeRoleCode(authUser.role.code)} />
      </Space>
    </div>
  )
}

export default App
