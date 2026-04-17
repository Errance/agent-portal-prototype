// ESLint 9 flat config
// 参考：typescript-eslint 作为单包（parser+plugin）聚合，适配 flat config
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // 全局忽略
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'coverage/**', '*.tsbuildinfo'],
  },

  // JS 基础规则
  js.configs.recommended,

  // TypeScript 推荐（非 type-checked 版本，避免 CI 慢）
  ...tseslint.configs.recommended,

  // React / Hooks / a11y
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React 17+ 自动 jsx runtime，不需要 import React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // 用 TS 类型
      'react/jsx-uses-react': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks 最关键（Privy 接入会高度依赖）
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TS 宽松档（不阻断 build，仅警告）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // a11y：启用 recommended 的一部分，但对 Chakra 的 div onClick 容忍
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',

      // import 排序（但不做循环依赖检查，避免慢）
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'never',
        },
      ],

      // 基础安全
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // Node 环境（配置文件等）
  {
    files: ['*.config.{js,ts}', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Test 环境
  {
    files: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier 必须放最后：禁用所有与 prettier 冲突的格式规则
  prettierConfig,
]
