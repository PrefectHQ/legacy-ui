module.exports = {
  chainWebpack: config => {
    config.resolve.symlinks(false)

    config.output.globalObject('this')

    config.module
      .rule('flow')
      .test(/\.flow$/)
      .use('ignore-loader')
      .loader('ignore-loader')
      .end()

    // This optimization comes from a long-standing bug with the terser webpack plugin
    // documented here: https://github.com/webpack-contrib/terser-webpack-plugin/issues/143,
    // and here: https://github.com/terser/terser/issues/571,
    // and here: https://github.com/webpack-contrib/terser-webpack-plugin/issues/202
    config.optimization.minimizer('terser').tap(args => {
      args[0].terserOptions = {
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        parallel: 4, // This should be changed if we modify the resource class of the Circle jobs running the build step
        cache: true,
        sourceMap: false,
        extractComments: false
      }
      return args
    })
  },

  configureWebpack: {
    devtool: 'source-map',
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 1000000,
        minChunks: 1,
        maxAsyncRequests: 6,
        maxInitialRequests: 4,
        automaticNameDelimiter: '~',
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    }
  },

  pluginOptions: {
    lintStyleOnBuild: true,
    stylelint: {},
    apollo: {
      lintGQL: true
    },
    webpackBundleAnalyzer: {
      analyzerMode: 'disabled'
    }
  }
}
