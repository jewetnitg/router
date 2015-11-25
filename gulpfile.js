/**
 * @author rik
 */
var gulp = require('gulp');
var _ = require('lodash');
var gulpLoadPlugins = require('gulp-load-plugins');
var path = require('path');
var includeAll = require('include-all');

var config = require('./build.config');

function registerTasks(options) {
  options = options || {};

  var registerDefinitions = importTasks(options.tasksDir);
  var plugins = loadGulpPlugins();

  invokeTaskRegisterFunctions(registerDefinitions, plugins);
  registerTaskSequences(options, plugins);

  gulp.task('default', [options.defaultTask]);
}

function loadGulpPlugins() {
  return gulpLoadPlugins({
    // the globs to search for
    pattern: ['gulp-*', 'merge-*', 'run-*', 'main-*'],

    // what to remove from the name of the module when adding it to the context
    replaceString: /\bgulp[\-.]|run[\-.]|merge[\-.]|main[\-.]/,

    // transforms hyphenated plugins names to camel case
    camelizePluginName: true,

    // path to package.json
    config: path.resolve(process.cwd(), './package.json'),

    // whether the plugins should be lazy loaded on demand
    lazy: true
  });
}

function registerTaskSequences(options, plugins) {
  _.each(options.tasks, function (tasks, taskName) {
    const taskFunction = function (gulp, plugins) {
      gulp.task(taskName, function (cb) {
        tasks.push(cb);
        plugins.sequence.apply(undefined, tasks);
      });
    };

    invokeTaskRegisterFunction(taskFunction, plugins);
  });
}

function importTasks(relPath) {
  return includeAll({
      dirname: path.resolve(process.cwd(), relPath),
      filter: /(.+)\.js$/i
    }) || {};
}

function invokeTaskRegisterFunctions(tasks, plugins) {
  _.each(tasks, function (task) {
    invokeTaskRegisterFunction(task, plugins);
  });
}

function invokeTaskRegisterFunction(task, plugins) {
  task(gulp, plugins, config);
}

registerTasks(config);