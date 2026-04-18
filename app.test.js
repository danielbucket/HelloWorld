import { strict as assert } from 'assert';
import { test } from 'node:test';
import http from 'node:http';
import app from './src/app.js';

test('GET /health returns 200 with status ok', async () => {
  const server = app.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/metrics/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /metrics without token returns 401 unauthorized', async () => {
  const server = app.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/metrics`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'missing_token');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /auth/issue-token returns 403 for invalid origin', async () => {
  const server = app.listen(0, '127.0.0.1');
  
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: ['read:metrics'] }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, 'invalid_origin');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /nonexistent returns 404 not found', async () => {
  const server = app.listen(0, '127.0.0.1');
  
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
