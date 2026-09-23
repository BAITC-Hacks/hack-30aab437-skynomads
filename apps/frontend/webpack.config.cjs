const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production' || process.env.NODE_ENV === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'eval-cheap-module-source-map',
    entry: {
      bundle: path.resolve(__dirname, 'app/index.tsx'),
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'static/js/[name].js',
      clean: true,
    },
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'build'),
      },
      watchFiles: path.join(__dirname, 'public'),
      port: 3000,
      open: true,
      hot: true,
      compress: true,
      historyApiFallback: true,
      client: {
        logging: 'none',
      },
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:7000',
        },
      ],
    },
    module: {
      rules: [
        {
          test: /\.(css|scss|sass)$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/i,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              [
                '@babel/preset-react',
                {
                  runtime: 'automatic',
                  development: !isProd,
                },
              ],
              '@babel/preset-typescript',
            ],
          },
        },

        {
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/media/[name][ext]',
          },
        },
        {
          test: /\.(woff|ttf|eot)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/media/[name][ext]',
          },
        },
        {
          test: /\.svg$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  [
                    '@babel/preset-react',
                    {
                      runtime: 'automatic',
                      development: !isProd,
                    },
                  ],
                ],
              },
            },
            {
              loader: '@svgr/webpack',
              options: { babel: false },
            },
          ],
        },
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'app'),
      },
      extensions: ['.*', '.ts', '.tsx', '.js', '.jsx'],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].css',
      }),
      new HtmlWebpackPlugin({
        filename: './index.html',
        template: './public/index.html',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public', 'initiatives'),
            to: path.resolve(__dirname, 'build', 'initiatives'),
          },
          {
            from: path.resolve(__dirname, 'public', 'favicon.ico'),
            to: path.resolve(__dirname, 'build'),
          },
          {
            from: path.resolve(__dirname, 'public', 'apple-touch-icon.png'),
            to: path.resolve(__dirname, 'build'),
          },
          {
            from: path.resolve(__dirname, 'public', 'robots.txt'),
            to: path.resolve(__dirname, 'build'),
          },
          {
            from: path.resolve(__dirname, 'public', 'uploads'),
            to: path.resolve(__dirname, 'build', 'static'),
          },
        ],
      }),
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
  };
};
