// npm packages
const tap = require('tap');

module.exports = (server, token, data) =>
  new Promise(resolve => {
    tap.test('Should get logs for current project', t => {
      // options base
      const options = {
        method: 'GET',
        url: `/logs/${encodeURIComponent(data.deployment)}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      server.inject(options, async response => {
        // check response
        t.equal(response.statusCode, 200, 'Correct status code');

        const {result} = response;
        const lines = result
          // split by lines
          .split('\n')
          // remove unicode chars
          .map(line => line.replace(/^\u0001.+?\d/, '').replace(/\n+$/, ''))
          // filter blank lines
          .filter(line => line && line.length > 0)
          // remove timestamps
          .map(line => {
            const parts = line.split(/\dZ\s/);
            return parts[1].replace(/\sv\d.+/, ''); // strip any versions
          });
        t.equal(lines[0], 'npm info it worked if it ends with ok');
        t.ok(lines[1].startsWith('npm info using npm@'));
        t.ok(lines[2].startsWith('npm info using node@'));
        t.deepEqual(
          lines.slice(3),
          [
            'npm info lifecycle node-project@1.0.0~prestart: node-project@1.0.0',
            'npm info lifecycle node-project@1.0.0~start: node-project@1.0.0',
            '',
            '> node-project@1.0.0 start /usr/src/app',
            '> node index.js',
            '',
            'Listening on port 80',
          ],
          'Should have correct log'
        );

        t.end();
      });
    });

    tap.test('Should not get logs for nonexistent project', t => {
      // options base
      const options = {
        method: 'GET',
        url: `/logs/do-not-exist`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      server.inject(options, async response => {
        // check response
        t.equal(response.statusCode, 404, 'Correct status code');
        t.deepEqual(response.result, {error: 'Container not found!'}, 'Should have error');
        t.end();
      });
    });

    tap.test('End', t => {
      resolve();
      t.end();
    });
  });
