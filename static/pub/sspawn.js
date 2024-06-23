/*!
 * sspawn(command, [args], [options], callback)
 *
 * var grep = sspawn('grep', ['ssh'], {
 *   stdio: inherit
 * }, function (error, result, code) {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log('Child process exited with: ' + code);
 * });
 */
var spawn = require('child_process').spawn;

var sspawn = function (cmd, args, options, done) {
  if (!Array.isArray(args)) {
    done = options;
    options = args;
    args = [];
  }

  if (typeof options !== 'object') {
    done = options;
    options = {};
  }

  var callDone = function (code, stdout, stderr) {
    done(code === 0 ? null : new Error(stderr), {
      stdout: stdout,
      stderr: stderr,
      code: code,
      toString: function () {
        if (code === 0) {
          return stdout;
        }

        return stderr;
      }
    }, code);
  };
  var child = spawn(cmd, args, options);
  var stdout = new Buffer('');
  var stderr = new Buffer('');

  child.stdout.on('data', function (data) {
    stdout = Buffer.concat([stdout, new Buffer(data)]);
  });

  child.stderr.on('data', function (data) {
    stderr = Buffer.concat([stderr, new Buffer(data)]);
  });

  child.on('close', function (code) {
    callDone(code, stdout.toString(), stderr.toString());
  });

  return child;
};
