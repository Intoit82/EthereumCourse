const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
var glob = require('glob');

module.exports = {

  
 
  entry: './app/javascripts/app.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },


  plugins: [
    // Copy our app's index.html to the build folder.
    new CopyWebpackPlugin([
      { from: './app/index.html', to: "index.html" }
      

    ]),
     // Copy our app's operator.html to the build folder.
    new CopyWebpackPlugin([
      { from: './app/operator.html', to: "operator.html" }
      

    ]),
     // Copy our app's operator.html to the build folder.
    new CopyWebpackPlugin([
      { from: './app/vehicle.html', to: "vehicle.html" }
      

    ]),
       
     // Copy our app's operator.html to the build folder.
    new CopyWebpackPlugin([
      { from: './app/toolBooth.html', to: "toolBooth.html" }
      

    ]),

     new CopyWebpackPlugin([
      { from: './app/stylesheets/app.css', to: "app.css" }
    ])
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}

