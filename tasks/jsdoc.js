var shell = require("gulp-shell");

module.exports = function (gulp) {
  return gulp.task('jsdoc', shell.task('./node_modules/.bin/jsdoc ./src -c ./jsdoc.config.json -R ./docs/README.md'));
};
