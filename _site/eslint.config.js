const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      eqeqeq: 'warn',
      curly: 'error',
      'dot-notation': 'warn',
      'no-process-exit': 'error',
    },
  },
];
