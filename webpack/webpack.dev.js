const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const config = require("./webpack.common.js");
const paths = require("./paths");

const devPath = path.join(__dirname, "..", "dev");

module.exports = merge(config, {
    mode: "development",

    entry: path.join(devPath, "index.ts"),

    output: {
        filename: "[name].js",
        path: paths.dist,
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },

    devServer: {
        contentBase: path.join(devPath, "videos"),
    },

    plugins: [new HtmlWebpackPlugin()],
});
