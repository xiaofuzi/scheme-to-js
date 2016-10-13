module.exports = {
    devtool: 'eval-source-map',
    entry: {
        app: './app.js',
        parser: './test/parser.js'
    },
    output: {
        path: './build',
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.(js)$/,                   
                loader: 'babel',                          //对匹配的文件进行处理的loader 
                exclude: /node_modules/                   //排除node module中的文件
            }
        ]
    }
}