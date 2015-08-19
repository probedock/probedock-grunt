module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    bump: {
      options: {
        commit: false,
        createTag: false,
        push: false
      }
    },

    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js'
      ]
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint']);
};
