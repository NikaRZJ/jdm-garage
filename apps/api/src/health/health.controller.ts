import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { HealthService } from './health.service.js'
import type { ReadinessReport } from './health.service.js'

interface LivenessReport {
  status: 'ok'
  uptimeSeconds: number
}

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Процесс жив. Ничего внешнего не трогает — иначе перезапуск по чужой недоступности. */
  @Get('health')
  liveness(): LivenessReport {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) }
  }

  /** Зависимости отвечают. 503, если хотя бы одна недоступна. */
  @Get('ready')
  async readiness(): Promise<ReadinessReport> {
    const report = await this.health.readiness()
    if (report.status === 'error') {
      throw new ServiceUnavailableException({ ...report, message: 'Зависимости недоступны' })
    }
    return report
  }
}
