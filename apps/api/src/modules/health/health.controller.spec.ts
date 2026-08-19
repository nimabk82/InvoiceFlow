import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports API liveness without claiming infrastructure readiness', () => {
    const health = controller.getHealth();

    expect(health).toEqual({
      environment: 'test',
      service: 'invoiceflow-api',
      status: 'ok',
      timestamp: expect.any(String) as string,
      uptimeSeconds: expect.any(Number) as number,
    });
    expect(Number.isNaN(Date.parse(health.timestamp))).toBe(false);
  });
});
