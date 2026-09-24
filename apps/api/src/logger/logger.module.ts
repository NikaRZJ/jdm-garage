import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Module } from '@nestjs/common'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          // Идентификатор запроса: берём из заголовка, если пришёл от прокси, иначе свой.
          genReqId: (req: IncomingMessage, res: ServerResponse): string => {
            const header = req.headers['x-request-id']
            const incoming = Array.isArray(header) ? header[0] : header
            const id = incoming ?? randomUUID()
            res.setHeader('x-request-id', id)
            return id
          },
          customProps: () => ({ service: 'jdm-garage-api' }),
          // По умолчанию pino-http пишет в лог все заголовки запроса. Оставляем необходимое:
          // короче в разработке и меньше шансов записать лишнее в production.
          serializers: {
            req: (req: IncomingMessage & { id?: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
          },
          // Проверку живости опрашивает прокси каждые несколько секунд — в логе она лишняя.
          autoLogging: { ignore: (req: IncomingMessage) => req.url === '/api/health' },
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
            censor: '[скрыто]',
          },
          transport:
            config.nodeEnv === 'development'
              ? {
                  target: 'pino-pretty',
                  options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
                }
              : undefined,
        },
      }),
    }),
  ],
})
export class LoggerModule {}
