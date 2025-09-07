module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/pages', '<rootDir>/components', '<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      { presets: [ ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript' ] }
    ],
  },
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/fileMock.js',
  },
  setupFilesAfterEnv: [],
};


