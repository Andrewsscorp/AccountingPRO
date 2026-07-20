/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }
};
