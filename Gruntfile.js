module.exports = (grunt) => {
  grunt.initConfig({
    nodemon: {
      dev: {
        script: 'bin/graphql-pouch',
        options: {
          watch: ['lib', 'test', 'server.js']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.registerTask('default',['nodemon']);
};