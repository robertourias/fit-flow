/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Baseline medido em 2026-06-19 (TASK19/T2): statements 88.1% / branches 74.44% /
  // functions 84.05% / lines 90.25% — thresholds abaixo arredondam para baixo com
  // margem de 1-2pp para não quebrar por flutuação mínima. Gate anti-regressão, não meta.
  coverageThreshold: {
    global: {
      statements: 86,
      branches: 72,
      functions: 82,
      lines: 88,
    },
  },
}

module.exports = config
