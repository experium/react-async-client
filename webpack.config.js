const path = require('path');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'app': './index.js'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: ['src', 'node_modules']
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'experium-modules.bundle.min.js',
        library: 'ExperiumModules',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'eslint-loader',
                options: {
                    emitWarning: true,
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ],
    },
    externals: /^[^./]/i
};
