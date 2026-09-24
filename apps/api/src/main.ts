import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import { APP_CONFIG } from './config/env.js'
import type { AppConfig } from './config/env.js'

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  bufferLogs: true,
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
  routeResolutionStrategy: 'specificity',
})

app.useLogger(app.get(Logger))
// Всё API живёт под /api: так фронт и API делят один адрес, а прокси различает их по пути.
app.setGlobalPrefix('api')
// Версию фреймворка наружу не сообщаем.
app.getHttpAdapter().getInstance().disable('x-powered-by')
app.enableShutdownHooks()

const config = app.get<AppConfig>(APP_CONFIG)
await app.listen(config.port, config.host)
