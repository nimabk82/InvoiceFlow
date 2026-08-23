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
  assert.equal(captured.init.headers.get('authorization'), 'Bearer session-token');
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

test('deduplicates identical concurrent GET requests', async () => {
  let resolveResponse;
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Promise((resolve) => {
      resolveResponse = resolve;
    });
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  const first = client.listBusinesses('same-token');
  const second = client.listBusinesses('same-token');
  assert.equal(calls, 1);

  resolveResponse(okResponse([{ id: 'b1' }]));
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(firstResult, secondResult);
});

test('does not deduplicate GET requests with different paths or auth', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return okResponse({ items: [] });
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  await Promise.all([
    client.listClients('business-1', 'token-1'),
    client.listProducts('business-1', 'token-1'),
    client.listClients('business-1', 'token-2'),
  ]);

  assert.equal(calls, 3);
});

test('evicts GET requests after resolution and rejection so they can retry', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 2) {
      return { ok: false, status: 503, json: async () => ({}) };
    }
    return okResponse([]);
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });

  await client.listBusinesses('token');
  await assert.rejects(client.listBusinesses('token'));
  await client.listBusinesses('token');

  assert.equal(calls, 3);
});

test('does not deduplicate concurrent mutation requests', async () => {
  let calls = 0;
  let resolveResponses;
  const responses = new Promise((resolve) => {
    resolveResponses = resolve;
  });
  const fetchImpl = async () => {
    calls += 1;
    await responses;
    return okResponse({ id: `b${calls}` });
  };
  const client = new ApiClient({ baseUrl: 'http://localhost:3001', fetchImpl });
  const input = { name: 'Acme', countryCode: 'CA', currencyCode: 'CAD' };

  const first = client.createBusiness(input, 'token');
  const second = client.createBusiness(input, 'token');
  assert.equal(calls, 2);

  resolveResponses();
  await Promise.all([first, second]);
});
