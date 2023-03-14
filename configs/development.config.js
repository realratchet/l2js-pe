const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "../src/index.jsx"),
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                exclude: /node_modules/,
                use: [{ loader: "style-loader" }, { loader: "css-loader" }, { loader: "postcss-loader" }],
            },
            {
                test: /\.(t|j)(s|sx)$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    presets: [
                        ["@babel/preset-env", { targets: { browsers: ["chrome >= 80"] } }],
                        ["@babel/preset-react", { runtime: "automatic" }],
                        [
                            "@babel/preset-typescript", {
                                allowNamespaces: true,
                                targets: {
                                    browsers: ["chrome >= 80"]
                                }
                            }
                        ]
                    ],
                    plugins: [
                        "@babel/transform-runtime",
                        "@babel/plugin-proposal-class-properties"
                    ]
                }
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                use: [{ loader: "file-loader?name=img/[name]__[hash:base64:5].[ext]" }]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                use: [{ loader: "file-loader?name=font/[name]__[hash:base64:5].[ext]" }]
            }
        ]
    },
    target: "electron-renderer",
    plugins: [
        new HtmlWebpackPlugin(),
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("development")
        })
    ],
    devtool: "source-map",
    devServer: {
        port: 5000,
        static: {
            directory: path.resolve(__dirname, "dist"),
        },
        devMiddleware: {
            stats: {
                colors: true,
                chunks: false,
                children: false
            }
        }
    }
};