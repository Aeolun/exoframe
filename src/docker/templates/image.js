// npm packages
const fs = require('fs');
const path = require('path');

// template name
exports.name = 'image';

// function to check if the template fits this recipe
exports.checkTemplate = async ({config}) => {
  // if project has image field defined in config
  try {
    return config.image && config.image.length;
  } catch (e) {
    return false;
  }
};

// function to execute current template
exports.executeTemplate = async ({config, username, tempDockerDir, folder, resultStream, util, docker}) => {
  // build docker image
  try {
    const {image, imageFile} = config;
    util.writeStatus(resultStream, {message: `Deploying project from image: ${image}..`, level: 'info'});

    // import from tar if needed
    if (imageFile && imageFile.length) {
      util.writeStatus(resultStream, {message: `Importing image from file: ${imageFile}..`, level: 'info'});
      // get packed stream
      const tarStream = fs.createReadStream(path.join(tempDockerDir, folder, imageFile));
      const importRes = await docker.daemon.loadImage(tarStream, {tag: image});
      util.logger.debug('Import result:', importRes);
    }

    // start image
    const container = await docker.start({image, username, folder, resultStream});
    util.logger.debug(container);

    // return new deployments
    util.writeStatus(resultStream, {message: 'Deployment success!', deployments: [container], level: 'info'});
    resultStream.end('');
  } catch (e) {
    util.logger.debug('build failed!', e);
    util.writeStatus(resultStream, {message: e.error, error: e.error, log: e.log, level: 'error'});
    resultStream.end('');
  }
};
