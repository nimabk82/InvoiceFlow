import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../config/environment';

export type HealthResponse = Readonly<{
  environment: EnvironmentVariables['NODE_ENV'];
  service: 'invoiceflow-api';
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}>;

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  getHealth(): HealthResponse {
    return {
      environment: this.config.get('NODE_ENV', { infer: true }),
      service: 'invoiceflow-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
