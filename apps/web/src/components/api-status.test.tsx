import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiStatus } from './api-status'

function renderWithQuery(ui: ReactNode) {
  // Свой клиент на каждый тест, без повторов: иначе ошибка появилась бы только после трёх попыток.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('ApiStatus', () => {
  it('показывает, что API работает', async () => {
    renderWithQuery(<ApiStatus />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('API работает')
    expect(alert.textContent).toContain('42')
  })

  it('показывает ошибку, если API не отвечает', async () => {
    server.use(http.get('/api/health', () => new HttpResponse(null, { status: 503 })))

    renderWithQuery(<ApiStatus />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('API недоступен')
  })

  it('показывает ошибку, если ответ не совпал с контрактом', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'ok' })))

    renderWithQuery(<ApiStatus />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('API недоступен')
  })
})
