import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpLoggingInterceptor } from './common/logging/http-logging.interceptor';
import { validateEnvironment } from './config/environment';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DocumentDefaultsModule } from './modules/document-defaults/document-defaults.module';
import { HealthModule } from './modules/health/health.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    HealthModule,
    BusinessesModule,
    ClientsModule,
    ProductsModule,
    InvoicesModule,
    DocumentDefaultsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
