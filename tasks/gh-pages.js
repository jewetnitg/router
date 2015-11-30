var shell = require('gulp-shell');
var path = require('path');
var packageJson = require('../package.json');

module.exports = function (gulp) {
  var url = null;
  var errorMessage = '';
  var tempDir = '.gh-pages';
  var archivePath = './build/build.tar.gz';
  var sourceDir = './build/docs/.';

  if (packageJson.repository) {
    if (packageJson.repository.type === 'git') {
      if (packageJson.repository.url) {
        var matches = packageJson.repository.url.match(/[^/]+@[\s|\S]+/g);

        if (matches && matches[0]) {
          url = matches[0];
        } else {
          errorMessage = 'repository url is malformed';
        }
      } else {
        errorMessage = 'repository url is missing from package.json';
      }
    } else {
      errorMessage = 'repository defined in package.json is not a git repository';
    }
  } else {
    errorMessage = 'no repository specified in package.json';
  }

  if (url && !errorMessage) {
    gulp.task('gh-pages', shell.task([
      // remove .gh-pages dir, this is our temp dir
      'rm -rf ' + tempDir,


      'git clone ' + path.resolve(process.cwd()) + ' ' + tempDir,
      'cp ' + archivePath + ' ' + tempDir,
      // go into the gh-pages directory and do git stuff
      'cd ' + tempDir + ' && '
      + 'git remote remove origin && '
        // set origin to be the repository specified in the package.json
      + 'git remote add origin ' + url + ' && '
      + 'git push origin --delete gh-pages && '
      + 'git checkout --orphan gh-pages && '
      + 'git rm -rf . && '
      + 'cp ../' + archivePath.replace(/^[\.|\/]+/g, '') + ' . && '
      + 'cp -R ../' + sourceDir.replace(/^[\.|\/]+/g, '') + ' . && '
      + 'git add -A && '
      + 'git commit -m "gh-pages committed from build" && '
      + 'git push origin gh-pages',

      'rm -rf ' + tempDir
    ]));
  } else {
    gulp.task('gh-pages', function (cb) {
      console.error('Can\'t run gulp task gh-pages, reason: ' + errorMessage);
      cb();
    });
  }

};
