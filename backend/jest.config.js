import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateSetups = [
  '<rootDir>/src/__tests__/setup.ts',
  '<rootDir>/tests/setup.ts',
];

const setupFiles = candidateSetups.filter(p =>
  fs.existsSync(path.resolve(__dirname, p.replace('<rootDir>', '.')))
);

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*\\.skip$',
    '.*\\.skip\\.ts$',
    '.*skip.*',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/controllers/WalletControllerDb.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: setupFiles,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  verbose: true,
  detectOpenHandles: true,
};
