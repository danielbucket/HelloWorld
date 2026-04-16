import { strict as assert } from 'assert';
import { test } from 'node:test';
import http from 'node:http';
import { requestHandler } from './server.js';

test('GET /health returns 200 with status ok', async () => {
  const server = http.createServer(requestHandler);
  server.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /metrics returns 200 with metrics object', async () => {
  const server = http.createServer(requestHandler);
  server.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/metrics`);
    assert.equal(res.status, 200);
    const body = await res.json();
    
    assert(typeof body.timestamp_epoch === 'number');
    assert(body.memory && typeof body.memory.total_kib === 'number');
    assert(body.load_average && typeof body.load_average['1m'] === 'number');
    assert(typeof body.uptime_seconds === 'number');
    assert(body.cpu_temperature_celsius === null || typeof body.cpu_temperature_celsius === 'number');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /nonexistent returns 404 with error', async () => {
  const server = http.createServer(requestHandler);
  server.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/nonexistent`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.deepEqual(body, { error: 'not_found' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /metrics returns 405 method not allowed', async () => {
  const server = http.createServer(requestHandler);
  server.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/metrics`, { method: 'POST' });
    assert.equal(res.status, 405);
    const body = await res.json();
    assert.deepEqual(body, { error: 'method_not_allowed' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
