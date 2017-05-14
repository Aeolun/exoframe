// npm packages
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const uuid = require('uuid');
const {exec} = require('child_process');

// our packages
const logger = require('../../logger');
const {tempDockerDir, getProjectConfig} = require('../util');

// compose file path
const composePath = path.join(tempDockerDir, 'docker-compose.yml');

exports.hasCompose = () => {
  // if project already has docker-compose - just exit
  try {
    fs.readFileSync(path.join(tempDockerDir, 'docker-compose.yml'));
    return true;
  } catch (e) {
    return false;
  }
};

exports.updateCompose = ({username}) => {
  // get project info
  const config = getProjectConfig();

  // generate name
  const baseName = config.name.split(':').shift();
  const uid = uuid.v1();

  // read compose file
  const compose = yaml.safeLoad(fs.readFileSync(composePath, 'utf8'));

  // modify networks
  compose.networks = Object.assign(
    {},
    {
      exoframe: {
        external: true,
      },
    },
    compose.networks
  );

  // modify services
  Object.keys(compose.services).forEach(svcKey => {
    const name = `${baseName}-${svcKey}-${uid.split('-').shift()}`;
    const backend = `${baseName}-${svcKey}`;
    // update basic settings
    const ext = {
      container_name: name,
      restart: 'always',
      networks: ['exoframe', 'default'],
    };
    compose.services[svcKey] = Object.assign({}, ext, compose.services[svcKey]);

    // update labels if needed
    const extLabels = {
      'exoframe.deployment': name,
      'exoframe.user': username,
      'traefik.backend': backend,
    };
    compose.services[svcKey].labels = Object.assign(
      {},
      extLabels,
      compose.services[svcKey].labels
    );
  });

  // write new compose back to file
  fs.writeFileSync(composePath, yaml.safeDump(compose), 'utf8');

  return compose;
};

exports.executeCompose = () =>
  new Promise((resolve, reject) => {
    exec(
      'docker-compose up -d',
      {
        cwd: tempDockerDir,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({log: `${stdout.toString()}\n${stderr.toString()}`});
      }
    );
  });
