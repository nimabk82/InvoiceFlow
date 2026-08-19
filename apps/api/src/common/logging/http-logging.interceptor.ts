import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

type RequestDetails = Readonly<{
  id: string;
  method: string;
  url: string;
}>;

type ResponseDetails = Readonly<{
  header: (name: string, value: string) => unknown;
  statusCode: number;
}>;

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestDetails>();
    const response = http.getResponse<ResponseDetails>();
    const startedAt = performance.now();
    const path = request.url.split('?')[0];

    response.header('x-request-id', request.id);

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          this.logger.error({
            durationMs: this.durationSince(startedAt),
            event: 'http_request',
            method: request.method,
            path,
            requestId: request.id,
            statusCode:
              error instanceof HttpException ? error.getStatus() : 500,
          });
        },
        next: () => {
          this.logger.log({
            durationMs: this.durationSince(startedAt),
            event: 'http_request',
            method: request.method,
            path,
            requestId: request.id,
            statusCode: response.statusCode,
          });
        },
      }),
    );
  }

  private durationSince(startedAt: number): number {
    return Number((performance.now() - startedAt).toFixed(2));
  }
}
