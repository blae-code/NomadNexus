export default [
  { ignores: ['dist', 'tailwind.config.js', 'vite.config.js', 'server.js', 'src/components/local_dev_setup/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {},
  },
]
