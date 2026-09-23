import { Test } from '@nestjs/testing'
import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { DatabaseModule, DRIZZLE, PG_POOL } from './database.module.js'
import type { Database } from './database.module.js'

async function build(pool: Pool) {
  return Test.createTestingModule({ imports: [DatabaseModule] })
    .overrideProvider(PG_POOL)
    .useValue(pool)
    .compile()
}

describe('DatabaseModule', () => {
  it('Drizzle работает поверх того же пула, а не открывает свой', async () => {
    const pool = { end: vi.fn() } as unknown as Pool
    const moduleRef = await build(pool)

    const db = moduleRef.get<Database>(DRIZZLE)

    expect(db.$client).toBe(pool)
  })

  it('закрывает пул при остановке приложения', async () => {
    const end = vi.fn().mockResolvedValue(undefined)
    const moduleRef = await build({ end } as unknown as Pool)

    await moduleRef.close()

    expect(end).toHaveBeenCalledOnce()
  })
})
