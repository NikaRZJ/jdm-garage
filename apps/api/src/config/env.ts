import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

  POSTGRES_HOST: z.string().min(1).default('127.0.0.1'),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535).default(5433),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),

  S3_ENDPOINT: z.string().min(1).default('http://127.0.0.1:9000'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(1).default('photos'),
  RUSTFS_ACCESS_KEY: z.string().min(1),
  RUSTFS_SECRET_KEY: z.string().min(1),
})

type Env = z.infer<typeof envSchema>

export interface AppConfig {
  readonly nodeEnv: Env['NODE_ENV']
  readonly host: string
  readonly port: number
  readonly logLevel: Env['LOG_LEVEL']
  readonly database: {
    readonly host: string
    readonly port: number
    readonly user: string
    readonly password: string
    readonly database: string
  }
  /** Имена переменных окружения привязаны к текущей реализации хранилища, поля конфига — нет. */
  readonly storage: {
    readonly endpoint: string
    readonly region: string
    readonly bucket: string
    readonly accessKeyId: string
    readonly secretAccessKey: string
  }
}

export const APP_CONFIG = Symbol('APP_CONFIG')

/**
 * Ищет `.env` от текущего каталога вверх до корня монорепозитория.
 * В production файла нет — переменные приходят из окружения, и это не ошибка.
 */
function loadEnvFile(): void {
  let dir = process.cwd()
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate)
      return
    }
    const parent = dirname(dir)
    if (parent === dir) return
    dir = parent
  }
}

export function loadConfig(): AppConfig {
  loadEnvFile()

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Некорректные переменные окружения — ${details}`)
  }

  const env = parsed.data
  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: Object.freeze({
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
    }),
    storage: Object.freeze({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.RUSTFS_ACCESS_KEY,
      secretAccessKey: env.RUSTFS_SECRET_KEY,
    }),
  })
}
