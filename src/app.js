import express from 'express';
import { metricsRouter } from './router.js';
import { rateLimiter } from './optimization/rateLimiter.js';
import { verifyToken, issueToken, checkProxyHeader } from './middleware/authMiddleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter());

app.use('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hello, World! This is a health check endpoint.',
  });
});

app.use(checkProxyHeader);
app.use('/metrics', verifyToken, metricsRouter);
app.post('/auth', issueToken);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

export default app;