module.exports = function(grunt) {
  // 1. All configuration goes here
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      calendar: {
        src: [
          'src/shared.js',
          'src/calendar.js',
          'src/push-notification.js'
        ],
        dest: 'public/src/build.js'
      },
      rides: {
        src: [
          'src/shared.js',
          'src/rideshare.js'
        ],
        dest: 'public/src/rides.js'
      },
    },

    uglify: {
      build: {
        src: 'public/src/build.js',
        dest: 'public/src/build.js'
      }
    },

    sass: {
      dist: {
        options: {
          style: 'compressed'
        },
        files: {
          'public/res/styles.css': 'res/styles.scss'
        }
      }
    }
  });

  // 3. Where we tell Grunt we plan to use this plug-in.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
  grunt.registerTask('default', ['concat:calendar', 'concat:rides', 'uglify', 'sass']);
  grunt.registerTask('dev', ['concat:calendar', 'concat:rides', 'sass']);

};
