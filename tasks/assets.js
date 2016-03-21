/**
 * Assets related
 */
var _ = require('lodash');

module.exports = function(grunt){
  var saveJSON = function(file, obj){
    grunt.file.write(file, JSON.stringify(obj, null, 4));
  }
  grunt.config.merge({
    // rev the file
    // mainly for the images

    filerev: {
      options: {
        length: 6,
        // change default `abc.xxxxxx.js` to `abc-xxxxxx.js`
        process: function(basename, name, extension){
          console.log(basename, name, extension);
          return basename + '-' +name+'.'+extension;
        }
      },

      image: {
        files: [{
          expand: true,
          cwd: '<%= pkg.src %>/images/',
          src: [
            '**/*.{png,jpg,gif,jpeg}',
            '!sprite/**',
            '!**/sprite/**',
            'sprite/*.{png,jpg,gif,jpeg}'
          ],
          dest: '<%= pkg.dist %>/images/'
        }]
      }
    },
  });

  grunt.registerTask('filerev.export',
    'export filerev summary to file',
    function(){
      saveJSON('./filerev.json', grunt.filerev.summary);
  })

  grunt.registerTask('assetsJSON',
      'merge webpack assets + filerev assets',
    function() {
      var map = _.clone(grunt.filerev.summary) || {};
        try {
            var webpackAsssets = grunt.file.readJSON('./webpack-main-assets.json');
        }catch(e){
            var webpackAssets = {};
        }
      map = _.chain(map)
        .mapKeys(function(v, k){ return k.replace(/^src\//,'')})
        .mapValues(function(v){ return v.replace(/^dist\//,'')})
        .merge(webpackAsssets)
        .value();
      grunt.file.write('./webpack-assets.json', JSON.stringify(map, null, 4))
    });

}
