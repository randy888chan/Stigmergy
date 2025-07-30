module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
  // --- FIX: Add the plugin to correctly handle 'import.meta.url' ---
  plugins: ["babel-plugin-transform-import-meta"],
};
