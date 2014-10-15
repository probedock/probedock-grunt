var _ = require('underscore'),
    fs = require('fs-extra'),
    path = require('path'),
    rox = require('rox-client-node'),
    temp = require('temp');

module.exports = function(grunt) {

  function setForce(force) {
    if (force && !grunt.option('force')) {
      grunt.config.set('rox:force', true);
      grunt.option('force', true);
    } else if (!force && grunt.config.get('rox:force')) {
      grunt.option('force', false);
      grunt.config.set('rox:force', false);
    }
  }

  grunt.registerMultiTask('roxGruntSetup', 'Set up ROX Center client', function() {

    var options = this.options({
      force: true
    });

    if (options.force) {
      setForce(true);
    }

    var tmpDir = process.env.ROX_GRUNT_TMP;
    if (!tmpDir) {
      temp.track();
      tmpDir = temp.mkdirSync();
      process.env['ROX_GRUNT_TMP'] = tmpDir;
    }

    tmpDir = path.join(tmpDir, this.target);
    fs.mkdirpSync(tmpDir);

    grunt.log.ok();
  });

  grunt.registerMultiTask('roxGruntPublish', 'Publish test results to ROX Center', function() {

    setForce(false);

    if (!process.env.ROX_GRUNT_TMP) {
      return grunt.log.error('The ROX_GRUNT_TMP environment variable must be set. Maybe you forgot to run the roxGruntSetup task.');
    }

    // TODO: allow to customize target
    var tmpDir = process.env.ROX_GRUNT_TMP,
        dataFile = path.join(tmpDir, 'data.json');

    if (!fs.existsSync(dataFile)) {
      return grunt.log.error('No data.json file found in ROX_GRUNT_TMP directory. Maybe you forgot a step in the ROX client setup.');
    }

    var data = rox.client.loadTestRun(dataFile),
        config = data.config,
        testRun = data.testRun;

    var numberOfResults = testRun.results.length;
    if (numberOfResults) {
      var numberOfResultsWithKey = _.reduce(testRun.results, function(memo, result) {
        return memo + (result.key ? 1 : 0);
      }, 0);

      grunt.log.writeln('Found ' + (numberOfResultsWithKey ? numberOfResultsWithKey : 'no') + ' results to send to ROX Center (' + numberOfResults + ' results in total)');
    }

    var done = this.async(),
        startTime = new Date().getTime();

    rox.client.process(testRun, config).then(_.partial(logInfo, startTime)).fail(logError).fin(done);
  });

  function logInfo(startTime, info) {
    if (info.errors.length) {
      _.each(info.errors, function(error) {
        grunt.log.error(error);
      });
    } else if (!info.published) {
      grunt.log.writeln('Publishing disabled');
    } else {
      var duration = new Date().getTime() - startTime;
      grunt.log.ok('Test results successfully published in ' + (duration / 1000) + 's');
    }
  }

  function logError(err) {
    grunt.log.error(err.message);
    grunt.log.verbose.error(err.stack);
  }
};
