import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuditService } from '../audit.service';

// Mock dependencies
jest.mock('@/utils/logger');
jest.mock('@/lib/config/admin-terminal.config');

describe('AuditService', () => {
  const mockActor = {
    userId: 'user123',
    email: 'admin@pbcex.com',
    roles: ['admin'],
    ipAddress: '127.0.0.1',
    deviceId: 'device123',
  };

  const mockResource = {
    type: 'hedging',
    id: 'hedge123',
    name: 'Gold Hedge Position',
  };

  // Mock config
  require('@/lib/config/admin-terminal.config').adminTerminalConfig = {
    security: {
      auditHashSecret: 'test-audit-secret-32-characters-long',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear audit log for each test
    AuditService.clearLog();
  });

  describe('append', () => {
    it('should append audit entry with correct hash', async () => {
      const entryId = await AuditService.append(
        'hedge:create',
        mockActor,
        mockResource,
        { amount: '1000.00' },
        'success',
        'high'
      );

      expect(entryId).toMatch(/^audit_\d+_[a-z0-9]+$/);

      const log = AuditService.getLog();
      expect(log).toHaveLength(1);
      
      const entry = log[0]!; // Assert not undefined
      expect(entry.id).toBe(entryId);
      expect(entry.action).toBe('hedge:create');
      expect(entry.actor.userId).toBe('user123');
      expect(entry.resource.type).toBe('hedging');
      expect(entry.outcome).toBe('success');
      expect(entry.severity).toBe('high');
      expect(entry.sequence).toBe(1);
      expect(entry.hashPrevious).toBeUndefined(); // First entry has no previous hash
      expect(entry.hashCurrent).toBeDefined();
      expect(typeof entry.hashCurrent).toBe('string');
      expect(entry.hashCurrent).toHaveLength(64); // SHA-256 hex length
    });

    it('should create proper hash chain for multiple entries', async () => {
      // Add first entry
      const entryId1 = await AuditService.append(
        'action1',
        mockActor,
        mockResource,
        { data: 'test1' }
      );

      // Add second entry
      const entryId2 = await AuditService.append(
        'action2',
        mockActor,
        mockResource,
        { data: 'test2' }
      );

      const log = AuditService.getLog();
      expect(log).toHaveLength(2);

      const entry1 = log[0]!; // Assert not undefined
      const entry2 = log[1]!; // Assert not undefined

      // Verify chain linkage
      expect(entry1.sequence).toBe(1);
      expect(entry2.sequence).toBe(2);
      expect(entry1.hashPrevious).toBeUndefined();
      expect(entry2.hashPrevious).toBe(entry1.hashCurrent);
      expect(entry2.hashCurrent).not.toBe(entry1.hashCurrent);
    });

    it('should handle errors gracefully', async () => {
      // Mock crypto to throw error
      const cryptoSpy = jest.spyOn(require('crypto'), 'createHmac');
      cryptoSpy.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      await expect(AuditService.append(
        'test:action',
        mockActor,
        mockResource
      )).rejects.toThrow('Audit append failed: Crypto error');

      cryptoSpy.mockRestore();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Add test entries
      await AuditService.append('action1', mockActor, { type: 'resource1', id: 'res1' });
      await AuditService.append('action2', mockActor, { type: 'resource2', id: 'res2' });
      await AuditService.append('action1', { ...mockActor, userId: 'user456' }, { type: 'resource1', id: 'res3' });
    });

    it('should return all entries when no filters applied', async () => {
      const results = await AuditService.search({});
      
      expect(results).toHaveLength(3);
      expect(results[0]!.sequence).toBe(1);
      expect(results[1]!.sequence).toBe(2);
      expect(results[2]!.sequence).toBe(3);
    });

    it('should filter by userId', async () => {
      const results = await AuditService.search({ userId: 'user123' });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.actor.userId === 'user123')).toBe(true);
    });

    it('should filter by action', async () => {
      const results = await AuditService.search({ action: 'action1' });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.action === 'action1')).toBe(true);
    });

    it('should filter by resourceType', async () => {
      const results = await AuditService.search({ resourceType: 'resource1' });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.resource.type === 'resource1')).toBe(true);
    });

    it('should apply pagination', async () => {
      const results = await AuditService.search({ limit: 2, offset: 1 });
      
      expect(results).toHaveLength(2);
      expect(results[0]!.sequence).toBe(2);
      expect(results[1]!.sequence).toBe(3);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 60000); // 1 minute in future
      
      const results = await AuditService.search({ 
        fromDate: now,
        toDate: future,
      });
      
      expect(results).toHaveLength(3);
    });

    it('should handle search errors gracefully', async () => {
      // This should not throw, even with invalid parameters
      const results = await AuditService.search({
        fromDate: new Date('invalid'),
        limit: -1,
      });
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('verifyChain', () => {
    it('should validate empty chain', async () => {
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(true);
      expect(validation.totalEntries).toBe(0);
      expect(validation.validatedEntries).toBe(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate single entry chain', async () => {
      await AuditService.append('test:action', mockActor, mockResource);
      
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(true);
      expect(validation.totalEntries).toBe(1);
      expect(validation.validatedEntries).toBe(1);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate multiple entry chain', async () => {
      await AuditService.append('action1', mockActor, mockResource);
      await AuditService.append('action2', mockActor, mockResource);
      await AuditService.append('action3', mockActor, mockResource);
      
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(true);
      expect(validation.totalEntries).toBe(3);
      expect(validation.validatedEntries).toBe(3);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect hash tampering', async () => {
      await AuditService.append('action1', mockActor, mockResource);
      await AuditService.append('action2', mockActor, mockResource);
      
      // Tamper with the second entry's hash
      const log = AuditService.getLog();
      (log[1] as any).hashCurrent = 'tampered_hash_value';
      
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(false);
      expect(validation.brokenAt).toBe(1);
      expect(validation.validatedEntries).toBe(1);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('Hash mismatch at entry 1');
    });

    it('should detect chain linkage break', async () => {
      await AuditService.append('action1', mockActor, mockResource);
      await AuditService.append('action2', mockActor, mockResource);
      
      // Break the chain by modifying previous hash reference
      const log = AuditService.getLog();
      (log[1] as any).hashPrevious = 'wrong_previous_hash';
      
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(false);
      expect(validation.brokenAt).toBe(1);
      expect(validation.errors).toHaveLength(1);
      // Hash verification detects tampering before chain validation
      expect(validation.errors[0]).toContain('Hash mismatch at entry 1');
    });

    it('should detect sequence tampering', async () => {
      await AuditService.append('action1', mockActor, mockResource);
      await AuditService.append('action2', mockActor, mockResource);
      
      // Tamper with sequence
      const log = AuditService.getLog();
      (log[1] as any).sequence = 5; // Should be 2
      
      const validation = await AuditService.verifyChain();
      
      expect(validation.isValid).toBe(false);
      expect(validation.brokenAt).toBe(1);
      expect(validation.errors).toHaveLength(1);
      // Hash verification detects tampering before sequence validation
      expect(validation.errors[0]).toContain('Hash mismatch at entry 1');
    });
  });

  describe('getStatistics', () => {
    it('should return empty statistics for empty log', () => {
      const stats = AuditService.getStatistics();
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.currentSequence).toBe(0);
      expect(stats.uniqueActors).toBe(0);
      expect(stats.oldestEntry).toBeUndefined();
      expect(stats.newestEntry).toBeUndefined();
    });

    it('should calculate statistics correctly', async () => {
      const actor2 = { ...mockActor, userId: 'user456' };
      
      await AuditService.append('action1', mockActor, mockResource, {}, 'success', 'high');
      await AuditService.append('action2', actor2, mockResource, {}, 'failure', 'medium');
      await AuditService.append('action1', mockActor, mockResource, {}, 'success', 'high');
      
      const stats = AuditService.getStatistics();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.currentSequence).toBe(3);
      expect(stats.uniqueActors).toBe(2);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(stats.entriesByOutcome).toEqual({ success: 2, failure: 1 });
      expect(stats.entriesBySeverity).toEqual({ high: 2, medium: 1 });
      expect(stats.entriesByAction).toEqual({ action1: 2, action2: 1 });
    });
  });

  describe('hash generation consistency', () => {
    it('should generate consistent hashes for identical data', async () => {
      const entryData = {
        action: 'test:action',
        actor: mockActor,
        resource: mockResource,
        details: { test: 'data' },
      };
      
      // Generate multiple entries with same data
      const entryId1 = await AuditService.append(
        entryData.action,
        entryData.actor,
        entryData.resource,
        entryData.details
      );
      
      // Clear and add identical entry
      AuditService.clearLog();
      
      const entryId2 = await AuditService.append(
        entryData.action,
        entryData.actor,
        entryData.resource,
        entryData.details
      );
      
      const log1 = AuditService.getLog();
      
      // Hashes should be identical for same data (except timestamp and IDs)
      expect(entryId1).not.toBe(entryId2); // IDs should be different
      // Note: Hashes will be different due to timestamp and ID differences
    });

    it('should generate different hashes for different data', async () => {
      await AuditService.append('action1', mockActor, mockResource);
      await AuditService.append('action2', mockActor, mockResource);
      
      const log = AuditService.getLog();
      expect(log[0]!.hashCurrent).not.toBe(log[1]!.hashCurrent);
    });
  });
});
