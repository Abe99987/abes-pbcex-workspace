import { logInfo, logError } from '@/utils/logger';

/**
 * Admin Terminal Governance Service
 * Manages maintenance mode, kill switches, and system toggles
 */

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  estimatedEnd?: string;
  bypassRoles?: string[];
}

export interface KillSwitch {
  service: string;
  enabled: boolean;
  reason?: string;
  enabledAt?: string;
  enabledBy?: string;
}

export interface FeatureToggle {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedRoles?: string[];
}

export class GovernanceService {
  private static maintenanceMode: MaintenanceConfig = { enabled: false };
  private static killSwitches: Map<string, KillSwitch> = new Map();
  private static featureToggles: Map<string, FeatureToggle> = new Map();

  // ===== MAINTENANCE MODE =====
  static getMaintenanceStatus(): MaintenanceConfig {
    return { ...this.maintenanceMode };
  }

  static setMaintenanceMode(config: Partial<MaintenanceConfig>, userId: string): boolean {
    try {
      this.maintenanceMode = { 
        ...this.maintenanceMode, 
        ...config,
        bypassRoles: config.bypassRoles || ['super_admin']
      };
      
      logInfo('Maintenance mode updated', { 
        enabled: this.maintenanceMode.enabled, 
        updatedBy: userId 
      });
      
      return true;
    } catch (error) {
      logError('Failed to set maintenance mode', error as Error);
      return false;
    }
  }

  static isMaintenanceMode(): boolean {
    return this.maintenanceMode.enabled;
  }

  static canBypassMaintenance(userRoles: string[]): boolean {
    if (!this.maintenanceMode.enabled) return true;
    
    const bypassRoles = this.maintenanceMode.bypassRoles || ['super_admin'];
    return userRoles.some(role => bypassRoles.includes(role));
  }

  // ===== KILL SWITCHES =====
  static setKillSwitch(service: string, enabled: boolean, reason?: string, userId?: string): boolean {
    try {
      const killSwitch: KillSwitch = {
        service,
        enabled,
        reason,
        enabledAt: enabled ? new Date().toISOString() : undefined,
        enabledBy: enabled ? userId : undefined
      };

      this.killSwitches.set(service, killSwitch);
      
      logInfo('Kill switch updated', { service, enabled, userId });
      return true;
    } catch (error) {
      logError('Failed to set kill switch', error as Error);
      return false;
    }
  }

  static getKillSwitch(service: string): KillSwitch | null {
    return this.killSwitches.get(service) || null;
  }

  static getAllKillSwitches(): Record<string, KillSwitch> {
    const switches: Record<string, KillSwitch> = {};
    for (const [service, config] of this.killSwitches) {
      switches[service] = { ...config };
    }
    return switches;
  }

  static isServiceEnabled(service: string): boolean {
    const killSwitch = this.killSwitches.get(service);
    return !killSwitch?.enabled;
  }

  // ===== FEATURE TOGGLES =====
  static setFeatureToggle(name: string, config: Partial<FeatureToggle>): boolean {
    try {
      const existing = this.featureToggles.get(name) || { name, enabled: false };
      this.featureToggles.set(name, { ...existing, ...config });
      
      logInfo('Feature toggle updated', { name, config });
      return true;
    } catch (error) {
      logError('Failed to set feature toggle', error as Error);
      return false;
    }
  }

  static isFeatureEnabled(name: string, userRoles?: string[]): boolean {
    const toggle = this.featureToggles.get(name);
    if (!toggle) return false;
    if (!toggle.enabled) return false;

    // Role-based feature access
    if (toggle.allowedRoles && userRoles) {
      return userRoles.some(role => toggle.allowedRoles!.includes(role));
    }

    // Rollout percentage (simple random)
    if (toggle.rolloutPercentage && toggle.rolloutPercentage < 100) {
      return Math.random() * 100 < toggle.rolloutPercentage;
    }

    return true;
  }

  static getAllFeatureToggles(): Record<string, FeatureToggle> {
    const toggles: Record<string, FeatureToggle> = {};
    for (const [name, config] of this.featureToggles) {
      toggles[name] = { ...config };
    }
    return toggles;
  }

  // ===== INITIALIZATION =====
  static initializeDefaults(): void {
    // Default kill switches
    this.setKillSwitch('trading', false);
    this.setKillSwitch('withdrawals', false);
    this.setKillSwitch('deposits', false);
    this.setKillSwitch('api', false);

    // Default feature toggles
    this.setFeatureToggle('admin_terminal', { name: 'admin_terminal', enabled: true });
    this.setFeatureToggle('dual_approval', { name: 'dual_approval', enabled: true });
    this.setFeatureToggle('audit_logging', { name: 'audit_logging', enabled: true });
    this.setFeatureToggle('step_up_auth', { name: 'step_up_auth', enabled: true });

    logInfo('Governance defaults initialized');
  }

  // ===== EMERGENCY PROCEDURES =====
  static emergencyStop(userId: string, reason: string): boolean {
    try {
      // Enable maintenance mode
      this.setMaintenanceMode({
        enabled: true,
        message: `Emergency maintenance - ${reason}`,
        bypassRoles: ['super_admin']
      }, userId);

      // Enable critical kill switches
      this.setKillSwitch('trading', true, reason, userId);
      this.setKillSwitch('withdrawals', true, reason, userId);
      this.setKillSwitch('api', true, reason, userId);

      logInfo('Emergency stop activated', { userId, reason });
      return true;
    } catch (error) {
      logError('Emergency stop failed', error as Error);
      return false;
    }
  }

  static emergencyResume(userId: string): boolean {
    try {
      // Disable maintenance mode
      this.setMaintenanceMode({ enabled: false }, userId);

      // Disable all kill switches
      for (const service of this.killSwitches.keys()) {
        this.setKillSwitch(service, false, 'Emergency resume', userId);
      }

      logInfo('Emergency resume activated', { userId });
      return true;
    } catch (error) {
      logError('Emergency resume failed', error as Error);
      return false;
    }
  }
}

// Initialize defaults on import
GovernanceService.initializeDefaults();
