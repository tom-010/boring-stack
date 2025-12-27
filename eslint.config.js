import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules/**", "build/**", ".react-router/**"],
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Turn off pedantic rules - we only care about real problems
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",

      // Keep these - they catch real bugs
      "no-undef": "off", // TypeScript handles this
      "no-unused-vars": "off", // Using @typescript-eslint version
      "prefer-const": "warn",
    },
  },
];
