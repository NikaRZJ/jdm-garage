import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

/** Ответы API по умолчанию для тестов. Отдельный тест может переопределить их через `server.use`. */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok', uptimeSeconds: 42 })),
]

export const server = setupServer(...handlers)
