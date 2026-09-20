import { Global, Inject, Module } from '@nestjs/common'
import type { OnApplicationShutdown } from '@nestjs/common'
import { Pool } from 'pg'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'

export const PG_POOL = Symbol('PG_POOL')

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
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end()
  }
}
