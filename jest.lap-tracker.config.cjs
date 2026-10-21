const nextJest = require('next/jest')

module.exports = nextJest({ dir: './' })({
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: [
    '<rootDir>/src/lib/lap-*.test.ts',
    '<rootDir>/src/app/api/lap-sessions/**/*.test.ts',
    '<rootDir>/src/app/lap-tracker/**/*.test.tsx',
    '<rootDir>/src/components/lap-tracker/**/*.test.tsx',
    '<rootDir>/supabase/tests/**/*.test.ts',
  ],
})
