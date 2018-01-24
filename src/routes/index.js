// our modules
const deploy = require('./deploy');
const list = require('./list');
const remove = require('./remove');
const logs = require('./logs');
const update = require('./update');
const version = require('./version');
const templates = require('./templates');

module.exports = (fastify, opts, next) => {
  // enable auth for all routes
  fastify.addHook('preHandler', fastify.auth([fastify.verifyJWT]));

  deploy(fastify);
  list(fastify);
  remove(fastify);
  logs(fastify);
  update(fastify);
  version(fastify);
  templates(fastify);

  next();
};
