import type { Config } from 'jest';
import nextJest from 'next/jest';

// Create Next.js jest configuration
const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

// Add any custom config to be passed to Jest
const config: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/',
    // Comment these out to enable all tests
    // '/tests/components/InvoiceForm.test.tsx',
    // '/tests/form-validation.test.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    // These packages use ES modules and need to be transformed
    'node_modules/(?!(query-string|decode-uri-component|split-on-first|filter-obj|@react-email|next-auth|@auth|stripe|@stripe|@hookform)/)',
  ],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      useESM: true,
    },
  },
};

// Create the final configuration with Next.js
export default createJestConfig(config);
