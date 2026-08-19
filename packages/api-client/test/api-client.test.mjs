import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiClient } from '../dist/index.js';

const okResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    environment: 'test',
    service: 'invoiceflow-api',
    status: 'ok',
    timestamp: '2026-08-19T00:00:00.000Z',
    uptimeSeconds: 1,
  }),
});

test('getHealth parses the health response', async () => {
  const fetchImpl = async () => okResponse();
  const client = new ApiClient({
    baseUrl: 'http://localhost:3001/',
    fetchImpl,
  });

  const health = await client.getHealth();

  assert.equal(health.status, 'ok');
  assert.equal(health.service, 'invoiceflow-api');
});

test('attaches the bearer token when a provider is set', async () => {
  let capturedHeaders;
  const fetchImpl = async (_url, init) => {
    capturedHeaders = init.headers;
    return okResponse();
  };
  const client = new ApiClient({
    baseUrl: 'http://localhost:3001',
    tokenProvider: () => 'secret-token',
    fetchImpl,
  });

  await client.getHealth();

  assert.equal(capturedHeaders.authorization, 'Bearer secret-token');
});

test('throws ApiRequestError on a non-ok response', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const client = new ApiClient({
    baseUrl: 'http://localhost:3001',
    fetchImpl,
  });

  await assert.rejects(client.getHealth(), (error) => {
    assert.equal(error.name, 'ApiRequestError');
    assert.equal(error.status, 500);
    return true;
  });
});
