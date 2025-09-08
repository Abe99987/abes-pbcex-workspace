module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/pages', '<rootDir>/components', '<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          target: 'ES2020',
        }
      }
    ],
  },
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/api$': '<rootDir>/utils/api.ts',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/tests/styleMock.js',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/fileMock.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};


