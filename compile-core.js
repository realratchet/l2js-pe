const path = require("path");
const webpack = require("webpack");
const { parentPort } = require("worker_threads");
const { SourceMapDevToolPlugin } = require("webpack");
const { createConfigBundle } = require("./node_modules/@l2js/core/configs/create-config");
const { realpathSync } = require("fs");

const config = createConfigBundle({
    name: "index.local",
    mode: "development",
    devtool: "source-map",
    minimize: false,
    dirOutput: realpathSync(path.resolve(__dirname, "l2js-core")),
    library: true
});

console.log(process.cwd());
console.log(realpathSync(path.resolve(__dirname, "./l2js-core/src")));

config.plugins.unshift(new SourceMapDevToolPlugin({
    filename: "[name].js.map[query]",
    sourceRoot: path.resolve(__dirname, "./l2js-core/") // yarn link will create a symbolic link
}));

const compiler = webpack(config);

compiler.run(function (err, result) {
    if (err)
        throw err;

    compiler.close(function (err) {
        if (err)
            throw err;
    });
});