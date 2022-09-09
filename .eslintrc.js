module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'plugin:vue/recommended',
    '@vue/prettier',
    'eslint:recommended'
  ],
  plugins: ['vuetify'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: false,
        trailingComma: 'none',
        printWidth: 80,
        htmlWhitespaceSensitivity: 'strict'
      }
    ],
    quotes: ['warn', 'single', { avoidEscape: true }],
    semi: ['warn', 'never'],
    'vuetify/grid-unknown-attributes': 'error',
    'vuetify/no-deprecated-classes': 'error',
    'vue/valid-v-slot': 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
