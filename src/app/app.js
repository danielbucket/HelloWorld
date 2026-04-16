const express = require('express');
const app = express();
const metricsRouter = require('./router');
const { rateLimiter } = require('./optimization/rateLimiter');
const { authMiddleware } = require('./middleware/authMiddleware');

app.use(rateLimiter());

app.use(express.json());
app.use('/metrics', authMiddleware.verifyToken, metricsRouter);
app.use('/auth', authMiddleware.issueToken);

app.all('*', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

export default app;