const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    // Ignored directories and files
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '*.min.js'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        exports: 'readonly',
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        // CommonJS globals
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Formatting rules (Prettier)
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'all',
          printWidth: 80,
          tabWidth: 2,
        },
      ],
      // Linting rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      eqeqeq: ['warn', 'always'],
      curly: ['error', 'all'],
      'dot-notation': 'warn',
      'no-process-exit': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'arrow-spacing': ['error', { before: true, after: true }],
      'space-before-function-paren': ['error', 'never'],
    },
  },
  {
    // Special configuration for test files
    files: ['**/__tests__/**/*.js'],
    rules: {
      'no-unused-vars': 'off', // Allow unused variables in test files
    },
  },
];
