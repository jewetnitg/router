var tar = require('gulp-tar');
var gzip = require('gulp-gzip');

module.exports = function (gulp) {

  gulp.task('tar', function () {
    return gulp.src('./build/dst/**')
      .pipe(tar('build.tar'))
      .pipe(gzip())
      .pipe(gulp.dest('./build/'))
  });

};
