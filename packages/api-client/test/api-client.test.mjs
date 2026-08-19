import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiClient } from '../dist/index.js';

const okResponse = (body) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

test('getHealth parses the health response', async () => {
  const fetchImpl = async () =>
    okResponse({
      environment: 'test',
      service: 'invoiceflow-api',
      status: 'ok',
      timestamp: '2026-08-19T00:00:00.000Z',
      uptimeSeconds: 1,
    });
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  const health = await client.getHealth();
  assert.equal(health.status, 'ok');
});

test('createBusiness sends the payload with a bearer token', async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return okResponse({
      id: 'b1',
      ownerAccountId: 'a1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  const business = await client.createBusiness(
    { name: 'Acme', countryCode: 'CA', currencyCode: 'CAD' },
    'session-token',
  );

  assert.equal(business.id, 'b1');
  assert.equal(captured.url, 'http://localhost:3001/businesses');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers.authorization, 'Bearer session-token');
});

test('listBusinesses returns the parsed list', async () => {
  const fetchImpl = async () => okResponse([{ id: 'b1' }]);
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  const businesses = await client.listBusinesses('session-token');
  assert.equal(businesses.length, 1);
  assert.equal(businesses[0].id, 'b1');
});

test('listClients hits the business-scoped clients endpoint', async () => {
  let capturedUrl;
  const fetchImpl = async (url) => {
    capturedUrl = url;
    return okResponse({ items: [{ id: 'c1', emails: [] }] });
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  const page = await client.listClients('business-1', 'session-token');
  assert.equal(capturedUrl, 'http://localhost:3001/businesses/business-1/clients');
  assert.equal(page.items.length, 1);
});

test('throws ApiRequestError on a non-ok response', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
  });
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  await assert.rejects(client.getHealth(), (error) => {
    assert.equal(error.name, 'ApiRequestError');
    assert.equal(error.status, 500);
    return true;
  });
});
