import { Request, Response } from 'express';
import { HealthCheckResponse } from '../types';

/**
 * Health check controller class
 */
export class HealthController {
  /**
   * Get health status
   */
  public static getHealth(req: Request, res: Response): void {
    const healthResponse: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date()
    };
    
    res.json(healthResponse);
  }
}