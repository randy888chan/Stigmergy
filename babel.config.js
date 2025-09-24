export default {
  presets: [
    ['@babel/preset-env', {
      // This tells Babel its target is modern Node, so it won't
      // transpile `import` into `require`, fixing the core conflict.
      targets: {
        node: 'current'
      }
    }],
    '@babel/preset-react'
  ],
  plugins: [
    'babel-plugin-transform-import-meta'
  ]
};