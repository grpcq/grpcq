module.exports = (grunt) => {
  grunt.initConfig({
    nodocs: {
      readme: {
        options: {
          src: ['index.js', 
          'tests/index.js', 'tests/*.js', 
          ],
          dest: 'README.md',
          start: ['/*'],
        }
      },
      reference: {
        options: {
          src: ['src/index.js', 'src/**/*.js'],
          dest: 'REFERENCE.md',
          start: ['/*'],
        }
      }
    }
  })
  grunt.loadNpmTasks('grunt-nodocs');

  grunt.registerTask('default', function() {
    grunt.log.writeln(`
    Usage: `)
    grunt.log.writeln(`
      - grunt nodocs
    `.yellow)
  })
}