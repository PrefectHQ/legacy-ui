module.exports = {
  presets: [['@vue/app', { useBuiltIns: 'entry' }]],
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining'
  ]
}
