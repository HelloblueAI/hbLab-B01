const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintPluginReact = require('eslint-plugin-react');
const eslintPluginReactHooks = require('eslint-plugin-react-hooks');
const eslintPluginJest = require('eslint-plugin-jest');
const eslintPluginJSX = require('eslint-plugin-jsx-a11y');
const eslintPluginTypescript = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js',
      '.next/**',
      'build/**',
      '.netlify/**',
      'venv/**',
      '**/site-packages/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
      },

      globals: {
        // Node.js globals
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',

        // Browser globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        confirm: 'readonly',
        SpeechRecognition: 'readonly',

        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      jest: eslintPluginJest,
      'jsx-a11y': eslintPluginJSX,
      '@typescript-eslint': eslintPluginTypescript,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
          arrowParens: 'always',
          bracketSpacing: true,
          endOfLine: 'lf',
        },
      ],

      // React-specific rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX Accessibility rules
      'jsx-a11y/anchor-is-valid': [
        'warn',
        {
          components: ['Link'],
          specialLink: ['to'],
          aspects: ['noHref', 'invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General rules
      'no-undef': 'error',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': 'error',
      'arrow-spacing': ['error', { before: true, after: true }],
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      'eol-last': ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
    plugins: { jest: eslintPluginJest },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'jest/no-commented-out-tests': 'warn',
      'jest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
    },
  },
];
