import { ServiceUnavailableException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { describe, expect, it, vi } from 'vitest'
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'
import type { ReadinessReport } from './health.service.js'

async function build(report: ReadinessReport): Promise<HealthController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: HealthService, useValue: { readiness: vi.fn().mockResolvedValue(report) } },
    ],
  }).compile()

  return moduleRef.get(HealthController)
}

const ok: ReadinessReport = {
  status: 'ok',
  checks: { database: { status: 'up' }, storage: { status: 'up' } },
}

describe('HealthController', () => {
  it('/health отвечает, не обращаясь к зависимостям', async () => {
    const controller = await build(ok)
    const report = controller.liveness()

    expect(report.status).toBe('ok')
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0)
  })

  it('/ready отдаёт отчёт, когда всё поднято', async () => {
    const controller = await build(ok)
    await expect(controller.readiness()).resolves.toEqual(ok)
  })

  it('/ready отвечает 503, когда зависимость недоступна', async () => {
    const failing: ReadinessReport = {
      status: 'error',
      checks: { database: { status: 'down', error: 'нет соединения' }, storage: { status: 'up' } },
    }
    const controller = await build(failing)

    await expect(controller.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException)
  })
})
