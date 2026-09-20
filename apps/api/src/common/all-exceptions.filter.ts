import type { ServerResponse } from 'node:http'
import { Catch, HttpException, HttpStatus } from '@nestjs/common'
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'

interface ErrorEnvelope {
  statusCode: number
  error: string
  message: string | string[]
  requestId?: string
  path?: string
  timestamp: string
}

/**
 * Единая точка превращения исключения в ответ.
 *
 * Исключения Nest (`HttpException`) отдаются как есть: их содержимое мы формируем сами,
 * в том числе отчёт `/ready`. Всё остальное — 500 с нейтральным текстом, подробности
 * только в лог, чтобы наружу не утекли трассировки и внутренние сообщения драйверов.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('exceptions')
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<{ id?: unknown; url?: string }>()
    const response = http.getResponse<ServerResponse>()

    const isHttpException = exception instanceof HttpException
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const requestId = typeof request.id === 'string' ? request.id : undefined

    const envelope: ErrorEnvelope = {
      statusCode,
      error: HttpStatus[statusCode] ?? 'ERROR',
      message: isHttpException ? exception.message : 'Внутренняя ошибка сервера',
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    // Полезная нагрузка HttpException может нести не только message: например, отчёт /ready
    // или список ошибок валидации. Сохраняем её, но статус остаётся за нами.
    const payload = isHttpException ? exception.getResponse() : undefined
    const body =
      typeof payload === 'object' && payload !== null
        ? { ...envelope, ...payload, statusCode }
        : envelope

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { err: exception, requestId, path: request.url },
        'ошибка обработки запроса',
      )
    } else {
      this.logger.warn({ statusCode, requestId, path: request.url }, 'запрос отклонён')
    }

    response.statusCode = statusCode
    response.setHeader('content-type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(body))
  }
}
