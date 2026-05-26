/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

module.exports = config;
