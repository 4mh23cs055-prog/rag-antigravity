import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

export function createHealthRouter(healthController: HealthController): Router {
  const router = Router();
  router.get('/health', healthController.getHealth);
  return router;
}
