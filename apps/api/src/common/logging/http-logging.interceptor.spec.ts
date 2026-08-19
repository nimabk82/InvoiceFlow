import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Logger,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';

import { HttpLoggingInterceptor } from './http-logging.interceptor';

describe('HttpLoggingInterceptor', () => {
  const createContext = () => {
    const header = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          id: 'req-test',
          method: 'GET',
          url: '/health?token=not-logged',
        }),
        getResponse: () => ({ header, statusCode: 200 }),
      }),
    } as ExecutionContext;

    return { context, header };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('adds a request id and logs successful request metadata', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const { context, header } = createContext();
    const next = { handle: () => of('ok') } as CallHandler;

    await lastValueFrom(new HttpLoggingInterceptor().intercept(context, next));

    expect(header).toHaveBeenCalledWith('x-request-id', 'req-test');
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_request',
        method: 'GET',
        path: '/health',
        requestId: 'req-test',
        statusCode: 200,
      }),
    );
  });

  it('logs the application status for failed requests', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { context } = createContext();
    const next = {
      handle: () => throwError(() => new BadRequestException()),
    } as CallHandler;

    await expect(
      lastValueFrom(new HttpLoggingInterceptor().intercept(context, next)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
