import { Router } from 'express';
import { ClimateController } from '../controllers/climateController';
import { HealthController } from '../controllers/healthController';

// Create router
const router = Router();

// Climate data routes
router.get('/climate-data', ClimateController.getAllClimateData);
router.get('/locations/:id', ClimateController.getLocationById);
router.get('/climate-data/coordinates', ClimateController.getClimateDataByCoordinates);

// Health check route
router.get('/health', HealthController.getHealth);

export default router;
