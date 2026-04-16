const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('./server');

test('GET /api/hardware-status proxies metrics payload', async () => {
  const metricsPayload = {
    uptime_seconds: 123,
    cpu_temperature_celsius: 52.3,
  };

  const metricsServer = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metricsPayload));
  });
  await new Promise((resolve) => metricsServer.listen(0, '127.0.0.1', resolve));
  const metricsPort = metricsServer.address().port;

  const app = createApp(`http://127.0.0.1:${metricsPort}/metrics`);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const appPort = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${appPort}/api/hardware-status`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, metricsPayload);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => metricsServer.close(resolve));
  }
});
