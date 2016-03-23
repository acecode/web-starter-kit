
module.exports = function(grunt){
  grunt.config.merge({
    // minify the images
    tinypng: {
      options: {
        // TODO maybe We should add lot of apiKey and random use one;
        apiKey: 'a5le0J1RmIKbTt-wZ2pCVkdjq2GZupt_',
        checkSigs: true,
        // recommend to save this file in SCM(git/svn)
        //   for quickly minify on everywhere

        // TODO thinking about it in production
        sigFile: 'tinypng_sigs.json',

        summarize: true,
        showProgress: true,
      },

      image: {
        files: [{
          expand: true,
          cwd: '<%= pkg.src %>/images/',
          // minify the images + sprite output images
          // not the origin sprites
          // TODO imagemin gif
          src: [
            '**/*.{png,jpg,jpeg}',
            '!sprite/**',
            '!**/sprite/**',
            'sprite/*.{png,jpg,jpeg}'
          ],
          dest: '<%= pkg.src %>/images/'
        }],
        // Target-specific file lists and/or options go here.
      },
    },
    imagemin: {
      gif: {
        files: [{
          expand: true,
          cwd: '<%= pkg.src %>/images/',
          src: '**/*.gif',
          dest: '<%= pkg.src %>/images/'
        }]
      }
    }
  });

  grunt.registerTask('imgMin', ['tinypng', 'imagemin']);
}
