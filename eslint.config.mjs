import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}'];
const sourceFiles = ['**/*.{cjs,cts,js,mjs,mts,ts}'];
const javascriptFiles = ['**/*.{cjs,js,mjs}'];

const requiredTypeAwareRules = [
  '@typescript-eslint/no-explicit-any',
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-misused-promises',
  '@typescript-eslint/no-unsafe-argument',
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/no-unsafe-call',
  '@typescript-eslint/no-unsafe-declaration-merging',
  '@typescript-eslint/no-unsafe-enum-comparison',
  '@typescript-eslint/no-unsafe-function-type',
  '@typescript-eslint/no-unsafe-member-access',
  '@typescript-eslint/no-unsafe-return',
  '@typescript-eslint/no-unsafe-type-assertion',
  '@typescript-eslint/no-unsafe-unary-minus',
  '@typescript-eslint/only-throw-error',
  '@typescript-eslint/require-await',
  '@typescript-eslint/switch-exhaustiveness-check',
];

export default defineConfig(
  globalIgnores(['dist/**', 'coverage/**']),
  {
    files: sourceFiles,
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: typescriptFiles,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...Object.fromEntries(requiredTypeAwareRules.map((ruleName) => [ruleName, 'error'])),
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          minimumDescriptionLength: 10,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
    },
  },
  {
    files: javascriptFiles,
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
