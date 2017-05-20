// our modules
const docker = require('../docker/docker');

module.exports = server => {
  server.route({
    method: 'GET',
    path: '/logs/{id}',
    config: {
      auth: 'token',
    },
    async handler(request, reply) {
      // get username
      const {username} = request.auth.credentials;
      const {id} = request.params;

      const allContainers = await docker.listContainers({all: true});
      const containerInfo = allContainers.find(
        c => c.Labels['exoframe.user'] === username && c.Names.find(n => n === `/${id}`)
      );

      if (!containerInfo) {
        reply({error: 'Container not found!'}).code(404);
        return;
      }

      const container = docker.getContainer(containerInfo.Id);
      const logStream = await container.logs({
        follow: false,
        stdout: true,
        stderr: true,
        timestamps: true,
      });
      reply(null, logStream);
    },
  });
};
