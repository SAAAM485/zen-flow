/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(swiper|ssr-window|dom7)/)'],
  testMatch: ["<rootDir>/tests/frontend/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^swiper/react$': '<rootDir>/tests/__mocks__/swiper.tsx',
    '^swiper/modules$': '<rootDir>/tests/__mocks__/swiper.tsx',
    '^swiper/css$': '<rootDir>/tests/__mocks__/swiper.tsx',
    '^swiper/css/navigation$': '<rootDir>/tests/__mocks__/swiper.tsx',
    '^swiper/css/pagination$': '<rootDir>/tests/__mocks__/swiper.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};