import { Request, Response } from 'express';
import { Register } from '../util/metric';
// import logger from '../util/logger';

/**
 * GET /metrics
 * Prometheus metrics exposition
 */
export const index = async (_req: Request, res: Response): Promise<void> => {
    res.set('Content-Type', Register.contentType);
    res.end(await Register.metrics());
};

// https://github.com/siimon/prom-client/blob/master/example/server.js
// server.get('/metrics', async (req, res) => {
//  try {
//      res.set('Content-Type', register.contentType);
//      res.end(await register.metrics());
//  } catch (ex) {
//      res.status(500).end(ex);
//  }
// });

// server.get('/metrics/counter', async (req, res) => {
//  try {
//      res.set('Content-Type', register.contentType);
//      res.end(await register.getSingleMetricAsString('test_counter'));
//  } catch (ex) {
//      res.status(500).end(ex);
//  }
// });
