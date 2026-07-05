/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@edham/shared-types$': '<rootDir>/../../../packages/shared-types/src/index.ts',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  testEnvironment: 'node',
};
