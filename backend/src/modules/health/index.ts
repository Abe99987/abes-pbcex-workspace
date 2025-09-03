export { HealthController } from './health.controller';
export { HealthService } from './health.service';
export { default as healthRoutes } from './health.routes';
export type { 
  HealthStatus, 
  ComponentHealth, 
  LivenessStatus, 
  ReadinessStatus 
} from './health.service';
