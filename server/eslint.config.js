// server/eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,

  // TypeScript-aware config for .ts files
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-console": "off"
    }
  },

  // Ignore build output
  {
    ignores: ["dist/**"]
  }
];
