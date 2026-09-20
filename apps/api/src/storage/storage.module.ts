import { S3Client } from '@aws-sdk/client-s3'
import { Global, Inject, Module } from '@nestjs/common'
import type { OnApplicationShutdown } from '@nestjs/common'
import { APP_CONFIG } from '../config/env.js'
import type { AppConfig } from '../config/env.js'

export const S3_CLIENT = Symbol('S3_CLIENT')

@Global()
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): S3Client =>
        new S3Client({
          endpoint: config.storage.endpoint,
          region: config.storage.region,
          // Самостоятельно размещённое хранилище адресует бакет путём, а не поддоменом.
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.storage.accessKeyId,
            secretAccessKey: config.storage.secretAccessKey,
          },
        }),
    },
  ],
  exports: [S3_CLIENT],
})
export class StorageModule implements OnApplicationShutdown {
  constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

  onApplicationShutdown(): void {
    this.client.destroy()
  }
}
