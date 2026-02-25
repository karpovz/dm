import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import './index.css'
import App from './App.tsx'

// Корневой контейнер гарантирован шаблоном index.html, поэтому используем non-null assertion.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4B0082',
          colorInfo: '#4B0082',
          colorBgBase: '#FFFFFF',
          fontFamily: 'ArialCustom, Arial, Helvetica, sans-serif',
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
