var webpack = require('webpack');
module.exports = {
	entry: {
		index: './ng.datetimepicker.js'
	},
	output: {
		filename: '[name].js'
	},
	module: {
		loaders: [{
			test: /\.js$/,
			loader: 'babel-loader',
			query: {
				// https://github.com/babel/babel-loader#options
				cacheDirectory: true,
				presets: ['es2015']
			}
		}, {
			test: /\.html$/,
			loader: 'html-loader'
		}, {
			test: /\.css$/,
			loader: 'style!css'
		}]
	},
	plugins: [
	    new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|ko|ja|zh-cn)$/)
	]
};