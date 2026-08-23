import { Test, type TestingModule } from '@nestjs/testing';

import {
  ACTIVITY_EVENT_REPOSITORY,
  type ActivityEventRepository,
} from './audit/repositories/activity-event.repository';
import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from './businesses/repositories/business.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from './clients/repositories/client.repository';
import {
  INVOICE_REPOSITORY,
  type InvoiceRepository,
} from './invoices/repositories/invoice.repository';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from './payments/repositories/payment.repository';
import {
  PRODUCT_SERVICE_REPOSITORY,
  type ProductServiceRepository,
} from './products/repositories/product-service.repository';
import {
  QUOTE_REPOSITORY,
  type QuoteRepository,
} from './quotes/repositories/quote.repository';
import {
  TAX_REPOSITORY,
  type TaxRepository,
} from './taxes/repositories/tax.repository';
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from './themes/repositories/theme.repository';

type RepositoryCase = Readonly<{
  token: symbol;
  label: string;
  fake:
    | ActivityEventRepository
    | BusinessRepository
    | ClientRepository
    | InvoiceRepository
    | PaymentRepository
    | ProductServiceRepository
    | QuoteRepository
    | TaxRepository
    | ThemeRepository;
}>;

const repositoryCases: readonly RepositoryCase[] = [
  {
    token: ACTIVITY_EVENT_REPOSITORY,
    label: 'ActivityEventRepository',
    fake: {
      record: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue({ items: [] }),
    },
  },
  {
    token: BUSINESS_REPOSITORY,
    label: 'BusinessRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      listByOwner: jest.fn().mockResolvedValue([]),
      isMember: jest.fn().mockResolvedValue(false),
      provisionOwnerBusiness: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: CLIENT_REPOSITORY,
    label: 'ClientRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [] }),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: INVOICE_REPOSITORY,
    label: 'InvoiceRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [] }),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: PAYMENT_REPOSITORY,
    label: 'PaymentRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      listByInvoice: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: PRODUCT_SERVICE_REPOSITORY,
    label: 'ProductServiceRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [] }),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: QUOTE_REPOSITORY,
    label: 'QuoteRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [] }),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: TAX_REPOSITORY,
    label: 'TaxRepository',
    fake: {
      findById: jest.fn().mockResolvedValue(null),
      listByBusiness: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    token: THEME_REPOSITORY,
    label: 'ThemeRepository',
    fake: {
      getTheme: jest.fn().mockResolvedValue(null),
      getVersion: jest.fn().mockResolvedValue(null),
      listByBusiness: jest.fn().mockResolvedValue([]),
      listVersions: jest.fn().mockResolvedValue([]),
      nextVersionNumber: jest.fn().mockResolvedValue(1),
      saveTheme: jest.fn().mockResolvedValue(undefined),
      createVersion: jest.fn().mockResolvedValue(undefined),
    },
  },
];

describe('repository abstractions', () => {
  for (const repositoryCase of repositoryCases) {
    it(`provides ${repositoryCase.label} through Nest DI`, async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          { provide: repositoryCase.token, useValue: repositoryCase.fake },
        ],
      }).compile();

      expect(module.get(repositoryCase.token)).toBe(repositoryCase.fake);
      await module.close();
    });
  }
});
