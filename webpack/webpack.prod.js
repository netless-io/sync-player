const { merge } = require("webpack-merge");
const config = require("./webpack.common.js");
const PeerDepsExternalsPlugin = require("peer-deps-externals-webpack-plugin");

module.exports = merge(config, {
    mode: "production",
    plugins: [new PeerDepsExternalsPlugin()],
});
