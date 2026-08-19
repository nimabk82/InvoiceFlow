import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.SUPABASE_URL ??= 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { logger: false },
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('serves the root endpoint through Fastify', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('InvoiceFlow API');
  });

  it('reports liveness and attaches a request id', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    const payload = response.json<{
      environment: string;
      service: string;
      status: string;
      timestamp: string;
      uptimeSeconds: number;
    }>();

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(payload).toEqual({
      environment: expect.any(String) as string,
      service: 'invoiceflow-api',
      status: 'ok',
      timestamp: expect.any(String) as string,
      uptimeSeconds: expect.any(Number) as number,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
