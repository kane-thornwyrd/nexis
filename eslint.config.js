const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  {
    name: "Kanethornwyrd config",
    env: {
      node: true,
      mocha: true,
    },
    extends: ["prettier/recommended", "plugin:prettier/recommended"],
    rules: {
      "prettier/semi": [2, "never"], // Remove optional semicolons at the end of each statement
      "prettier/endOfLine": ["error", "lf"], // Use Unix line endings
      "prettier/printWidth": [2, 80], // Set the maximum line width to 80 characters
      "prettier/trailingComma": [2, "es5"], // Use trailing commas for arrays and objects
      "no-console": "error", // Disable console.log statements
      "no-debugger": "error", // Disable debugger statements
      "global-strict": "error", // Enable strict mode globally
      "no-return-assign": "error", // Disable return statements with assignment expressions
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
      sourceType: "module",
      ecmaVersion: 2020,
      extraFileExtensions: [".ts"],
      project: "./tsconfig.json",
    },
    plugins: ["prettier", "@typescript-eslint", "react"],
    settings: {
      "import/resolver": {
        node: { paths: ["src/**/*", "node_modules/**/*"] },
      },
      react: {
        version: "detect",
      },
    },
    excludes: ["node_modules/**/*"],
    globals: {
      self: true,
      console: true,
      document: true,
      window: true,
    },
  },
  eslintPluginPrettierRecommended,
];
