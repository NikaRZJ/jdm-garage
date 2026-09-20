import { HeadBucketCommand } from '@aws-sdk/client-s3'
import type { S3Client } from '@aws-sdk/client-s3'
import { Test } from '@nestjs/testing'
import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'
import { PG_POOL } from '../database/database.module.js'
import { S3_CLIENT } from '../storage/storage.module.js'
import { HealthService } from './health.service.js'

const config = { storage: { bucket: 'photos' } } as AppConfig

async function build(pool: Partial<Pool>, storage: Partial<S3Client>): Promise<HealthService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      HealthService,
      { provide: PG_POOL, useValue: pool },
      { provide: S3_CLIENT, useValue: storage },
      { provide: APP_CONFIG, useValue: config },
    ],
  }).compile()

  return moduleRef.get(HealthService)
}

describe('HealthService', () => {
  it('считает контур готовым, когда обе зависимости отвечают', async () => {
    const send = vi.fn().mockResolvedValue({})
    const service = await build({ query: vi.fn().mockResolvedValue({ rows: [] }) }, {
      send,
    } as unknown as Partial<S3Client>)

    await expect(service.readiness()).resolves.toEqual({
      status: 'ok',
      checks: { database: { status: 'up' }, storage: { status: 'up' } },
    })
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand)
  })

  it('сообщает об ошибке базы, не падая сам', async () => {
    const service = await build(
      { query: vi.fn().mockRejectedValue(new Error('соединение отклонено')) },
      { send: vi.fn().mockResolvedValue({}) } as unknown as Partial<S3Client>,
    )

    const report = await service.readiness()
    expect(report.status).toBe('error')
    expect(report.checks.database).toEqual({ status: 'down', error: 'соединение отклонено' })
    expect(report.checks.storage).toEqual({ status: 'up' })
  })

  it('не ждёт вечно: зависшая проверка закрывается по таймауту', async () => {
    vi.useFakeTimers()
    const service = await build({ query: vi.fn().mockReturnValue(new Promise(() => {})) }, {
      send: vi.fn().mockResolvedValue({}),
    } as unknown as Partial<S3Client>)

    const pending = service.checkDatabase()
    await vi.advanceTimersByTimeAsync(2_500)
    const result = await pending
    vi.useRealTimers()

    expect(result.status).toBe('down')
  })
})
