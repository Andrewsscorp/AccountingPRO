import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import { MantineProvider } from '@mantine/core'
import App from './App.tsx'
import './index.css'

import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
