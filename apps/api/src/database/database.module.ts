import { Global, Inject, Module } from '@nestjs/common'
import type { OnApplicationShutdown } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'
import * as schema from '../schema.js'

export const PG_POOL = Symbol('PG_POOL')
export const DRIZZLE = Symbol('DRIZZLE')

/**
 * Объект Drizzle со всей схемой проекта — через него сервисы делают запросы.
 * Это псевдоним типа, а не класс, поэтому внедряется только по токену: `@Inject(DRIZZLE)`.
 */
export type Database = NodePgDatabase<typeof schema> & { $client: Pool }

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): Pool =>
        new Pool({
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          database: config.database.database,
          max: 10,
          connectionTimeoutMillis: 3_000,
          idleTimeoutMillis: 30_000,
          application_name: 'jdm-garage-api',
        }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      // Своих соединений Drizzle не открывает — работает поверх того же пула.
      useFactory: (pool: Pool): Database => drizzle({ client: pool, schema }),
    },
  ],
  exports: [PG_POOL, DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end()
  }
}
