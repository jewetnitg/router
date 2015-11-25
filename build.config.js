/**
 * @author rik
 */

/**
 * @name build.config
 * @desc The build.config file contains config for builds
 * @property taskDir {String} The directory in which to look for gulp tasks
 * @property defaultTask {String} The default task to run when gulp is ran without arguments
 * @property tasks {Object<Object<Array>>} Object containing sequences of tasks
 * @type {Object}
 */
var buildConfig = {

  // directory in which the tasks are located, tasks may be nested under directories
  tasksDir: "./tasks",

  // default task to run, eg. this task is ran when running gulp without a task
  defaultTask: "build",

  tasks: {

    // alias for build:prod
    "build": [
      // clean build dir
      "clean",

      // run tests once
      "test",

      // run browserify
      "browserify",

      // create documentation
      "jsdoc",

      // put the build in an archive
      "tar"

    ],

    // publishes the documentation to github pages
    "publish": [
      // build the project
      "build",

      // publish documentation on github pages, this only works if you have your git public key on github
      "gh-pages"
    ]

  }

};

module.exports = buildConfig;