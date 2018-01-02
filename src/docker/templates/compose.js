// npm packages
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const uuid = require('uuid');
const {spawn} = require('child_process');

// our packages
const logger = require('../../logger');
const {tempDockerDir, getProjectConfig, writeStatus} = require('../../util');
const docker = require('../../docker/docker');

// compose file path
const composePath = path.join(tempDockerDir, 'docker-compose.yml');

// function to update compose file with required vars
const updateCompose = ({username}) => {
  // get project info
  const config = getProjectConfig();

  // generate name
  const baseName = `exo-${_.kebabCase(username)}-${_.kebabCase(config.name.split(':').shift())}`;
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
      restart: 'on-failure:2',
      networks: ['exoframe', 'default'],
    };
    compose.services[svcKey] = Object.assign({}, ext, compose.services[svcKey]);

    // update labels if needed
    const extLabels = {
      'exoframe.deployment': name,
      'exoframe.user': username,
      'exoframe.project': baseName,
      'traefik.backend': backend,
    };
    compose.services[svcKey].labels = Object.assign({}, extLabels, compose.services[svcKey].labels);
  });

  // write new compose back to file
  fs.writeFileSync(composePath, yaml.safeDump(compose), 'utf8');

  return compose;
};

// function to execute docker-compose file and return the output
const executeCompose = resultStream =>
  new Promise(resolve => {
    const dc = spawn('docker-compose', ['up', '-d'], {cwd: tempDockerDir});

    dc.stdout.on('data', data => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      writeStatus(resultStream, {message, level: hasError ? 'error' : 'info'});
    });
    dc.stderr.on('data', data => {
      const message = data.toString().replace(/\n$/, '');
      const hasError = message.toLowerCase().includes('error');
      writeStatus(resultStream, {message, level: hasError ? 'error' : 'info'});
    });
    dc.on('exit', code => {
      writeStatus(resultStream, {message: `Docker-compose exited with code ${code.toString()}`, level: 'info'});
      resolve(code.toString());
    });
  });

// function to check if the template fits this recipe
exports.checkTemplate = async () => {
  // if project already has docker-compose - just exit
  try {
    fs.readFileSync(composePath);
    return true;
  } catch (e) {
    return false;
  }
};

// function to execute current template
exports.executeTemplate = async ({username, resultStream}) => {
  // if it does - run compose workflow
  logger.debug('Docker-compose file found, executing compose workflow..');
  writeStatus(resultStream, {message: 'Deploying docker-compose project..', level: 'info'});

  // update compose file with project params
  const composeConfig = updateCompose({username});
  logger.debug('Compose modified:', composeConfig);
  writeStatus(resultStream, {message: 'Compose file modified', data: composeConfig, level: 'verbose'});

  // execute compose
  const exitCode = await executeCompose(resultStream);
  logger.debug('Compose executed, exit code:', exitCode);

  // get container infos
  const allContainers = await docker.listContainers({all: true});
  const deployments = await Promise.all(
    Object.keys(composeConfig.services)
      .map(svc => composeConfig.services[svc].container_name)
      .map(name => allContainers.find(c => c.Names.find(n => n === `/${name}`)))
      .map(info => docker.getContainer(info.Id))
      .map(container => container.inspect())
  );
  // return them
  writeStatus(resultStream, {message: 'Deployment success!', deployments, level: 'info'});
  resultStream.end('');
};
