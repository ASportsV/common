const path = require("path");

/**
 *
 * Returns the `babel` loader from the provided `config`.
 *
 * `create-react-app` defines two `babel` configurations, one for js files
 * found in `src/` and another for any js files found outside that directory.
 * This function can target either using the `isOutsideOfApp` param.
 *
 * @param {*} config The webpack config to search.
 * @param {boolean} isOutsideOfApp Flag for whether to use the `babel-loader`
 * for matching files in `src/` or files outside of `src/`.
 */
const getBabelLoader = (config, isOutsideOfApp) => {
  let babelLoaderFilter;
  if (isOutsideOfApp) {
    babelLoaderFilter = rule =>
      rule.loader && rule.loader.includes("babel") && rule.exclude;
  } else {
    babelLoaderFilter = rule =>
      rule.loader && rule.loader.includes("babel") && rule.include;
  }

  // First, try to find the babel loader inside the oneOf array.
  // This is where we can find it when working with react-scripts@2.0.3.
  let loaders = config.module.rules.find(rule => Array.isArray(rule.oneOf))
    .oneOf;

  let babelLoader = loaders.find(babelLoaderFilter);

  // If the loader was not found, try to find it inside of the "use" array, within the rules.
  // This should work when dealing with react-scripts@2.0.0.next.* versions.
  if (!babelLoader) {
    loaders = loaders.reduce((ldrs, rule) => ldrs.concat(rule.use || []), []);
    babelLoader = loaders.find(babelLoaderFilter);
  }
  return babelLoader;
};

module.exports = {
  // Update webpack config to use custom loader for worker files
  webpack: (config) => {
    // Note: It's important that the "worker-loader" gets defined BEFORE the TypeScript loader!
    config.module.rules.unshift({
      test: /\.worker\.ts$/,
      use: {
        loader: 'worker-loader',
        options: {
          // Use directory structure & typical names of chunks produces by "react-scripts"
          filename: 'static/js/[name].[contenthash:8].js',
        },
      },
    });

    // common
    const commonDir = path.resolve(__dirname, 'src')
    const include = getBabelLoader(config).include
    getBabelLoader(config).include = (Array.isArray(include) ? include : [include]).concat([
      commonDir
    ])
    config.resolve = {
      ...config.resolve,
      alias: {
        "common": commonDir
      },
      // extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts']
    }

    // scope
    const scopePluginIndex = config.resolve.plugins.findIndex(
      ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin'
    );
    config.resolve.plugins[scopePluginIndex].appSrcs.push(commonDir)

    return config;
  },
};