import express from 'express';
import { GET } from './controllers/index.js';

const metricsRouter = express.Router();

metricsRouter.route('/', GET.system_metrics);

export { metricsRouter };