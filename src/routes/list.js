// our modules
const docker = require('../docker/docker');

module.exports = server => {
  server.route({
    method: 'GET',
    path: '/list',
    config: {
      auth: 'token',
    },
    async handler(request, reply) {
      // get username
      const {username} = request.auth.credentials;

      const allContainers = await docker.listContainers({all: true});
      const userContainers = await Promise.all(
        allContainers
          .filter(c => c.Labels['exoframe.user'] === username) // get only user containers
          .filter(c => !c.Names.find(n => n === '/exoframe-traefik')) // filter out traefik
          .map(c => docker.getContainer(c.Id))
          .map(c => c.inspect())
      );

      reply(userContainers);
    },
  });
};
