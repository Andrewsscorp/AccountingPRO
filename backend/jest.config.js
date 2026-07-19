module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
    }],
  },
  moduleNameMapper: {
    '^@prisma/client-global$': '<rootDir>/node_modules/@prisma/client-global/index.js',
    '^@prisma/client-tenant$': '<rootDir>/node_modules/@prisma/client-tenant/index.js',
  },
};
