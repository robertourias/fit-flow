/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { decoratorMetadata: true },
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts', '**/test/**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Baseline de cobertura medido em 2026-06-19 (TASK19/T1): statements 89.89%,
  // branches 65.39%, functions 80.07%, lines 90.74%. Limiares abaixo aplicam
  // margem de 1-2 pontos para não quebrar por flutuação mínima — ratchet
  // anti-regressão, não meta aspiracional (ver docs/context/decisions.md).
  coverageThreshold: {
    global: {
      statements: 88,
      branches: 63,
      functions: 78,
      lines: 89,
    },
  },
}

module.exports = config
