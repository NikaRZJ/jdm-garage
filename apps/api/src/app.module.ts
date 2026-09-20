import { Module, StandardSchemaValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { AllExceptionsFilter } from './common/all-exceptions.filter.js'
import { ConfigModule } from './config/config.module.js'
import { DatabaseModule } from './database/database.module.js'
import { HealthModule } from './health/health.module.js'
import { LoggerModule } from './logger/logger.module.js'
import { StorageModule } from './storage/storage.module.js'

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule, StorageModule, HealthModule],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
