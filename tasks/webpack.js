var path = require('path');
var chalk = require('chalk');
module.exports=function(grunt){

  // set up webpack's entry property for file
  //  `entry/*.js`

  grunt.registerTask('entry', 'find the entrys ', function() {
    var done = this.async();
    var entry = grunt.file.expand({
      cwd: './src'
    }, ['./entry/*.js']);

    var entryMap = {};
    var entryDevMap = {};
    entry.forEach(function(entry) {
      var name = path.basename(entry, '.js')
      entryMap[name] = ['./src', entry].join(path.sep);
      entryDevMap[name] = [
        'webpack/hot/only-dev-server',
        entry
      ]
      grunt.verbose.writeln('entry set ', chalk.red(name), '=>', chalk.yellow(entryMap[name]));
    })

    grunt.config.set('webpack.options.entry', entryMap);
    grunt.config.set('webpack-dev-server.options.webpack.entry', entryDevMap);

    done();
  });

}
