
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
module.exports = function(grunt){

  grunt.config.merge({
    sprite:{}
  });

 // initSprite settings from file

  grunt.registerTask('spriteInit', 'set up sprites', function() {

    // make target config for each dir
    function getTargetConf(target, dir) {
      var obj = {};
      obj[target] = {
        src: dir + '/*.png',
        dest: '<%= pkg.src %>/images/sprite/' + target + '.png',
        destCss: '<%= pkg.src %>/stylesheets/sprite/' + target +
          '.styl',
        cssSpritesheetName: target,
        imgPath: '../images/sprite/' + target + '.png',
        cssVarMap: function(sprite) {
          sprite.name = target + '_' + sprite.name;
        }
      }
      return obj;
    }

    // find the dirs
    //    which is not empty
    var list = grunt.file.expand({},
      [
        grunt.template.process('<%= pkg.src%>/images/sprite/*'),
        grunt.template.process('<%= pkg.src%>/images/*/sprite{*,}/')
      ]
    );

    //make up config object
    list = list.filter(function(src){
      grunt.verbose.writeln('[filter]', src);
      if(!grunt.file.isDir(src)){
        grunt.verbose.warn(src, 'is not a dir');
        return false;
      }else if(fs.readdirSync(src).length === 0){
        grunt.verbose.warn(src, 'is an empty dir');
        return false;
      }else {
        grunt.verbose.ok(src, 'is good sprite Dir');
        return true;
      }
    });
    grunt.verbose.ok('list', list);

    list.forEach(function(dir) {

      var name = path.basename(dir);

      // for these *project use sprite* 'images/project-a/sprite'
      //    the name is in middle
      if( name.indexOf('sprite')=== 0 ){
        var subName = name.replace(/^sprite-?/, '');
        if( subName === ''){
          name = path.basename(path.dirname(dir))
        }else{
          name = path.basename(path.dirname(dir)) + '-' + subName;
        }
      }

      var baseConfig = getTargetConf(name, dir);
      var config = {};
      var configPath = path.join(dir, 'config.json');

      // U can add config in the sprite DIR,
      //    `config.json` which will overwrite the other config

      if (grunt.file.exists(configPath)) {
        config[name] = require(path.join('..', configPath))
      }

      baseConfig = _.merge({
        x: baseConfig
      }, {
        x: config
      }).x;

      grunt.verbose.ok(dir + ' config\n')

      // save all the config
      grunt.config.merge({
        sprite: baseConfig
      });
    })

  });

}
