const express = require('express');

function createApp(metricsApiUrl) {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/hardware-status', async (_req, res) => {
    try {
      const response = await fetch(metricsApiUrl, { headers: { Accept: 'application/json' } });

      if (!response.ok) {
        return res.status(502).json({
          error: 'metrics_api_unavailable',
          status: response.status,
        });
      }

      const payload = await response.json();
      return res.json(payload);
    } catch {
      return res.status(502).json({ error: 'metrics_api_unreachable' });
    }
  });

  return app;
}

function startServer() {
  const port = process.env.PORT || 3000;
  const metricsApiUrl = process.env.METRICS_API_URL || 'http://metrics-api:8000/metrics';
  const app = createApp(metricsApiUrl);
  app.listen(port, () => {
    console.log(`express server listening on 0.0.0.0:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp };
