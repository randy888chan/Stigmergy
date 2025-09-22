import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  return {
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
      },
      alias: {
        process: "process/browser.js"
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development')
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
};