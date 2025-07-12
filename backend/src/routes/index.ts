import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import {DataController} from "../controllers/dataController";

const router = Router();

router.get('/data', DataController.getDataByLatLon);

router.get('/health', HealthController.getHealth);

export default router;
