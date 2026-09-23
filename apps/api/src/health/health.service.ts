import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Inject, Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'
import { DRIZZLE } from '../database/database.module.js'
import type { Database } from '../database/database.module.js'
import { S3_CLIENT } from '../storage/storage.module.js'

export type ComponentHealth = { status: 'up' } | { status: 'down'; error: string }

export interface ReadinessReport {
  status: 'ok' | 'error'
  checks: {
    database: ComponentHealth
    storage: ComponentHealth
  }
}

const CHECK_TIMEOUT_MS = 2_000

@Injectable()
export class HealthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(S3_CLIENT) private readonly storage: S3Client,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async readiness(): Promise<ReadinessReport> {
    const [database, storage] = await Promise.all([this.checkDatabase(), this.checkStorage()])
    const status = database.status === 'up' && storage.status === 'up' ? 'ok' : 'error'
    return { status, checks: { database, storage } }
  }

  async checkDatabase(): Promise<ComponentHealth> {
    return probe(async () => {
      // Через Drizzle, а не напрямую через пул: так /ready проверяет тот же путь, которым ходят сервисы.
      await this.db.execute(sql`select 1`)
    })
  }

  async checkStorage(): Promise<ComponentHealth> {
    return probe(async () => {
      await this.storage.send(new HeadBucketCommand({ Bucket: this.config.storage.bucket }))
    })
  }
}

async function probe(check: () => Promise<void>): Promise<ComponentHealth> {
  try {
    await withTimeout(check(), CHECK_TIMEOUT_MS)
    return { status: 'up' }
  } catch (error) {
    return { status: 'down', error: reason(error) }
  }
}

function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`проверка не ответила за ${String(ms)} мс`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer)
  })
}

/**
 * Drizzle заворачивает ошибку драйвера в свою («Failed query: …»), а настоящая причина —
 * например, «connect ECONNREFUSED» — лежит в `cause`. Для отчёта нужна именно причина.
 */
function reason(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  return error.cause instanceof Error ? error.cause.message : error.message
}
