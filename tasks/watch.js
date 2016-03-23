module.exports=function(grunt){

  grunt.config.merge({
    chokidar: {
      go: {
        files: [
          'web/*.go',
          '*.go'
        ],
        tasks: [
          'shell:goBuild',
          'serve',
        ],
        options: {
          spawn: false,
          debounceDelay: 250,
          event: ['change', 'add']
        },
      },
      sprite: {
        files: [
          '<%= pkg.src %>/images/sprite/**',
          '<%= pkg.src %>/images/*/sprite*/*'
        ],
        tasks: [
          'spriteInit',
          'sprite'
        ],
        options: {
          spawn: false
        }
      },

      imageRev: {
        files: [
          '<%= pkg.src %>/images/**/*.{png,jpg,gif,jpeg}',
          '!<%= pkg.src %>/images/sprite/**',
          '!<%= pkg.src %>/images/**/sprite/**',
          '<%= pkg.src %>/images/sprite/*.{png,jpg,gif,jpeg}'
        ],
        tasks: [
          'filerev',
          'filerev.export'
        ]
      },

      assetsJSON: {
        files: [
          './webpack-main-assets.json',
          './filerev.json'
        ],
        tasks: [
          'assetsJSON'
        ],
        options: {
          spawn: false
        }
      }
    }
  });

}
