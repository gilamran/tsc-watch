/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/src/test/*.test.ts"],
  testTimeout: 30000,
};