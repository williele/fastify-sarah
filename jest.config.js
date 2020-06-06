module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: "./tests/tsconfig.json",
    },
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/tests/**/*.test.(ts|js)"],
  testEnvironment: "node",
  setupFiles: ["./tests/polyfill.ts"],
  collectCoverage: true,
};
