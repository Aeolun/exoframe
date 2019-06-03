// our modules
const docker = require('../docker/docker');
const {removeContainer} = require('../docker/util');
const {getPlugins} = require('../plugins');
const {removeFunction} = require('../faas');
const logger = require('../logger');

// removal of normal containers
const removeUserContainer = async ({username, id, reply}) => {
  // look for normal containers
  const allContainers = await docker.listContainers({all: true});
  const containerInfo = allContainers.find(
    c => c.Labels['exoframe.user'] === username && c.Names.find(n => n === `/${id}`)
  );

  // if container found by name - remove
  if (containerInfo) {
    await removeContainer(containerInfo);
    reply.code(204).send('removed');
    return;
  }

  // if not found by name - try to find by project
  const containers = allContainers.filter(
    c => c.Labels['exoframe.user'] === username && c.Labels['exoframe.project'] === id
  );
  if (!containers.length) {
    reply.code(404).send({error: 'Container not found!'});
    return;
  }
  // remove all
  await Promise.all(containers.map(removeContainer));
  // reply
  reply.code(204).send('removed');
};

module.exports = fastify => {
  fastify.route({
    method: 'POST',
    path: '/remove/:id',
    async handler(request, reply) {
      // get username
      const {username} = request.user;
      const {id} = request.params;

      // try and remove function
      if (removeFunction({id, username})) {
        // reply
        reply.code(204).send('removed');
        return;
      }

      // run remove via plugins if available
      const plugins = getPlugins();
      for (const plugin of plugins) {
        // only run plugins that have remove function
        if (!plugin.remove) {
          continue;
        }

        const result = await plugin.remove({docker, username, id, reply});
        logger.debug('Running remove with plugin:', plugin.config.name, result);
        if (plugin.config.exclusive) {
          logger.debug('Remove finished via exclusive plugin:', plugin.config.name);
          return;
        }
      }

      removeUserContainer({username, id, reply});
    },
  });
};
