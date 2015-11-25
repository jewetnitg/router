/**
 * @author rik
 */
var Server = require('karma').Server;

module.exports = function (gulp) {

  var configFile = __dirname + '/../karma.conf.js';

  gulp.task('test', function (done) {
    startKarmaServer(done, true);
  });

  gulp.task('test:ci', function (done) {
    startKarmaServer(done);
  });

  function startKarmaServer(done, singleRun) {
    new Server({
      configFile: configFile,
      singleRun: singleRun || false
    }, done).start();
  }

};