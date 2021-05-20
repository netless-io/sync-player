const paths = require("./paths");
const ESLintPlugin = require("eslint-webpack-plugin");
const { NoEmitOnErrorsPlugin } = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
    entry: [paths.entryFile],

    devtool: "source-map",

    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                use: [
                    {
                        loader: "babel-loader",
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        new NoEmitOnErrorsPlugin(),
        new ESLintPlugin({
            fix: true,
            extensions: "ts",
            files: "src",
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: paths.tsConfig,
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true,
                    declaration: true,
                },
            },
        }),
    ],

    resolve: {
        extensions: [".ts", ".js"],
    },

    output: {
        filename: "index.js",
        path: paths.dist,
        libraryTarget: "umd",
        library: "SyncPlayer",
    },
};
