import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["assets/**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"],  rules: {
    "no-unused-vars": "warn",
    "no-undef": "warn",
  } },
  { files: ["assets/**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
]);
