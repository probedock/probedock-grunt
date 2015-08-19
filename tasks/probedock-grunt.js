var _ = require('underscore'),
    fs = require('fs-extra'),
    path = require('path'),
    probedock = require('probedock-node'),
    temp = require('temp');

module.exports = function(grunt) {

  function setForce(force) {
    if (force && !grunt.option('force')) {
      grunt.config.set('probedock:force', true);
      grunt.option('force', true);
    } else if (!force && grunt.config.get('probedock:force')) {
      grunt.option('force', false);
      grunt.config.set('probedock:force', false);
    }
  }

  grunt.registerMultiTask('probedockSetup', 'Set up the Probe Dock probe', function() {

    var options = this.options({
      force: true
    });

    if (options.force) {
      setForce(true);
    }

    var tmpDir = process.env.PROBEDOCK_GRUNT_TMP;
    if (!tmpDir) {
      temp.track();
      tmpDir = temp.mkdirSync();
      process.env['PROBEDOCK_GRUNT_TMP'] = tmpDir;
    }

    tmpDir = path.join(tmpDir, this.target);
    fs.mkdirpSync(tmpDir);

    grunt.log.ok();
  });

  grunt.registerMultiTask('probedockPublish', 'Publish test results to Probe Dock', function() {

    setForce(false);

    if (!process.env.PROBEDOCK_GRUNT_TMP) {
      return grunt.log.error('The PROBEDOCK_GRUNT_TMP environment variable must be set. Maybe you forgot to run the probedockSetup task.');
    }

    // TODO: allow to customize target
    var tmpDir = process.env.PROBEDOCK_GRUNT_TMP,
        dataFile = path.join(tmpDir, 'data.json');

    if (!fs.existsSync(dataFile)) {
      return grunt.log.error('No data.json file found in PROBEDOCK_GRUNT_TMP directory. Maybe you forgot a step in the Probe Dock probe setup.');
    }

    var data = probedock.client.loadTestRun(dataFile),
        config = data.config,
        testRun = data.testRun;

    var numberOfResults = testRun.results.length;
    if (numberOfResults) {
      grunt.log.writeln('Found ' + numberOfResults + ' results to send to Probe Dock');
    }

    var done = this.async(),
        startTime = new Date().getTime();

    probedock.client.process(testRun, config).then(_.partial(logInfo, startTime)).fail(logError).fin(done);
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
