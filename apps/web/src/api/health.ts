import { z } from 'zod'

// Временный ручной клиент. На задаче 1.7 клиент API начнёт генерироваться из OpenAPI,
// и этот файл удаляется вместе с вызовом.

const healthSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number().nonnegative(),
})

export type Health = z.infer<typeof healthSchema>

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const response = await fetch('/api/health', { signal })
  if (!response.ok) {
    throw new Error(`API ответил ${String(response.status)}`)
  }
  // Ответ сервера проверяется схемой: если контракт разъедется, упадёт здесь, а не в разметке.
  return healthSchema.parse(await response.json())
}
