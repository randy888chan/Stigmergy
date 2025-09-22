import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import { createRequire } from 'module'; // <-- IMPORT THE HELPER

const require = createRequire(import.meta.url); // <-- CREATE A LOCAL 'require' FUNCTION

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './dashboard/src/index.js',
  output: {
    path: path.resolve(__dirname, 'dashboard/public'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      // Use the 'require.resolve' we created above. This is now correct.
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
      "stream": false,
      "http": false,
      "https": false,
      "url": false,
      "util": false,
      "path": false,
      "os": false,
      "crypto": false,
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dashboard/public'),
    },
    compress: true,
    port: 3000,
  },
};