const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
//const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    entry: {
        main: path.resolve(__dirname, './client/js/main.js'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Endless war JS',
            template: path.resolve(__dirname, './client/template.html'), 
            filename: 'index.html',
        }),
        //new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
              { from: "./client/plugins", to: "plugins" },
              { from: "./client/assets", to: "assets" },
              { from: "./client/favicon.ico", to: "favicon.ico" },
            ],
          }),
    ],
}