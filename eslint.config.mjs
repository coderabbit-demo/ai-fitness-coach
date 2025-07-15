import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base Next.js rules for all files
  ...compat.extends("next/core-web-vitals"),
  
  // Production code rules - stricter for main app code
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**/*", "**/label.test.tsx"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // TypeScript - focus on real bugs (using Next.js built-in rules)
      "no-unused-vars": "off", // Disable base rule
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true 
      }],
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error
      "@typescript-eslint/no-empty-object-type": "warn",
      
      // React - practical rules
      "react/no-unescaped-entities": "error",
      "react-hooks/exhaustive-deps": "warn", // Warn instead of error
      
      // Next.js - important for performance
      "@next/next/no-img-element": "warn", // Warn instead of error
      
      // Import rules
      "@typescript-eslint/no-require-imports": "error",
    },
  },
  
  // Test files - more relaxed rules
  {
    files: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**/*"],
    rules: {
      // Allow common test patterns
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", // Tests often need any
      "@typescript-eslint/no-require-imports": "off", // Allow require in tests
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
  
  // API routes - slightly different rules
  {
    files: ["**/api/**/*.{js,ts}"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "no-unused-vars": "off", // Disable base rule
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^(req|res|next|_)",
        "varsIgnorePattern": "^_" 
      }],
    },
  },
];

export default eslintConfig;
